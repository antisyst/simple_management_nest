import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { User } from '../auth/user.entity';
import { Comment } from './comment.entity';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private emailService: EmailService,
  ) {}

  async getTasks(user: User): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { user },
      relations: ['comments'],
    });
  }

  async getTaskById(id: number, user: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, user },
      relations: ['comments'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return task;
  }

  async createTask(
    {
      title,
      description,
      category,
      labels,
    }: {
      title: string;
      description: string;
      category?: string;
      labels?: string[];
    },
    user: User,
  ): Promise<Task> {
    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
      category,
      labels,
      user,
    });

    try {
      await this.tasksRepository.save(task);
      await this.sendNotification(
        user,
        `Task "${task.title}" created successfully!`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error while creating task. Please try again later.',
      );
    }

    return task;
  }

  async deleteTask(id: number, user: User): Promise<void> {
    const task = await this.getTaskById(id, user);

    const result = await this.tasksRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    await this.sendNotification(
      user,
      `Task "${task.title}" deleted successfully!`,
    );
  }

  async updateTaskStatus(
    id: number,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = status;

    try {
      await this.tasksRepository.save(task);
      await this.sendNotification(
        user,
        `Task "${task.title}" status updated to "${status}"!`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error while updating task status. Please try again later.',
      );
    }

    return task;
  }

  async addComment(
    taskId: number,
    user: User,
    commentText: string,
  ): Promise<Task> {
    const task = await this.getTaskById(taskId, user);

    const comment = this.commentsRepository.create({
      text: commentText,
      user,
      task,
    });

    try {
      await this.commentsRepository.save(comment);
      await this.sendNotification(
        user,
        `Comment added to task "${task.title}"!`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error while adding comment. Please try again later.',
      );
    }

    task.comments.push(comment);
    return task;
  }

  private async sendNotification(user: User, message: string): Promise<void> {
    try {
      await this.emailService.sendEmail(
        user.email,
        'Task Management Notification',
        message,
      );
    } catch (error) {
      console.error('Failed to send email notification:', error.message);
    }
  }
}
