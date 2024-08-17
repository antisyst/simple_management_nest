import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  BaseEntity,
} from 'typeorm';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { User } from '../auth/user.entity';
import { Comment } from './comment.entity';

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity()
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.OPEN,
  })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status: TaskStatus;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @MaxLength(50, { each: true })
  labels: string[];

  @ManyToOne(() => User, (user) => user.tasks, { eager: false })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.task, { cascade: true })
  comments: Comment[];
}
