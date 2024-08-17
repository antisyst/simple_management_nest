import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from '../auth/user.entity';
import { Task } from './task.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.comments, { eager: false })
  user: User;

  @ManyToOne(() => Task, (task) => task.comments, { eager: false })
  task: Task;
}
