import {Overlord} from '../Overlord';
import {ReserverSetup} from '../../creepSetup/defaultSetups';
import {Zerg} from '../../Zerg';
import {DirectiveOutpost} from '../../directives/core/directive_outpost';
import {Tasks} from '../../tasks/Tasks';
import {OverlordPriority} from '../priorities_overlords';
import {profile} from '../../profiler/decorator';

@profile
export class ReservingOverlord extends Overlord {

	reservers: Zerg[];
	reserveBuffer: number;

	constructor(directive: DirectiveOutpost, priority = OverlordPriority.remoteRoom.reserve) {
		super(directive, 'reserve', priority);
		// Change priority to operate per-outpost
		this.priority += this.outpostIndex * OverlordPriority.remoteRoom.roomIncrement;
		this.reservers = this.creeps('reserver');
		this.reserveBuffer = 3000;
	}

	init() {
		if (!this.room || this.room.controller!.needsReserving(this.reserveBuffer)) {
			this.wishlist(1, new ReserverSetup());
		} else {
			this.wishlist(0, new ReserverSetup());
		}
	}

	private handleReserver(reserver: Zerg): void {
		if (reserver.room == this.room && !reserver.pos.isEdge) {
			// If reserver is in the room and not on exit tile
			if (!this.room.controller!.signedByMe) {
				// Takes care of an edge case where planned newbie zone signs prevents signing until room is reserved
				if (!this.room.my && this.room.controller!.signedByScreeps) {
					reserver.task = Tasks.reserve(this.room.controller!);
				} else {
					reserver.task = Tasks.signController(this.room.controller!);
				}
			} else {
				reserver.task = Tasks.reserve(this.room.controller!);
			}
		} else {
			// reserver.task = Tasks.goTo(this.pos);
			reserver.travelTo(this.pos);
		}
	}

	run() {
		for (let reserver of this.reservers) {
			if (reserver.isIdle) {
				this.handleReserver(reserver);
			}
			reserver.run();
		}
	}
}
