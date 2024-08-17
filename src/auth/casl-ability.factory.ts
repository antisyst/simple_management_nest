import {
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Task } from '../tasks/task.entity';
import { User } from './user.entity';

export type Subjects = typeof Task | typeof User | Task | User;

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type AppAbility = PureAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(
      PureAbility as AbilityClass<AppAbility>,
    );

    if (user.isAdmin) {
      can(Action.Manage, [Task, User]);
    } else {
      can(Action.Read, Task);
      can(Action.Create, Task);
      can(Action.Update, Task, { userId: user.id });
      can(Action.Delete, Task, { userId: user.id });
      cannot(Action.Manage, User).because(
        'You are not allowed to manage users',
      );
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
