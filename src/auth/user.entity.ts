import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Task } from '../tasks/task.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => Task, (task) => task.user, { eager: true })
  tasks: Task[];

  @BeforeInsert()
  async beforeInsert() {
    this.username = this.username.toLowerCase();
  }
}
