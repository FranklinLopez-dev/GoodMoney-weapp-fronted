import { Injectable, signal, computed } from '@angular/core';
import { Activities, Positions, ProfileTables } from 'src/app/core/models';

@Injectable({ providedIn: 'root' })
export class ProfilesTablesStore {

  private _tables = signal<ProfileTables | null>(null);
  private _loading = signal(false);

  readonly tables = this._tables.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly hasData = computed(() => !!this._tables());

  set(tables: any) {
    this._tables.set(structuredClone(tables));
  }

  clear() {
    this._tables.set(null);
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  upsertPosition(position: Positions) {
    this._tables.update(prev => {
      if (!prev) return prev;

      const positions = [...prev.positions];
      const index = positions.findIndex(p => p.id === position.id);

      if (index >= 0) {
        positions[index] = position;
      } else {
        positions.push(position);
      }

      return {
        ...prev,
        positions
      };
    });
  }

  upsertActivity(activity: Activities) {
    this._tables.update(prev => {
      if (!prev) return prev;

      const activities = [...prev.activities];
      const index = activities.findIndex(a => a.id === activity.id);

      if (index >= 0) {
        activities[index] = activity;
      } else {
        activities.push(activity);
      }

      return {
        ...prev,
        activities
      };
    });
  }

}