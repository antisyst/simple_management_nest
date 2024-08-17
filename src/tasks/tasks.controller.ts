import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../auth/user.entity';
import { CaslAbilityFactory, Action } from '../auth/casl-ability.factory';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  getTasks(@GetUser() user: User): Promise<Task[]> {
    return this.tasksService.getTasks(user);
  }

  @Get('/:id')
  async getTaskById(
    @Param('id') id: number,
    @GetUser() user: User,
  ): Promise<Task> {
    const task = await this.tasksService.getTaskById(id, user);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  @Post()
  async createTask(
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('category') category: string,
    @Body('labels') labels: string[],
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.createTask(
      { title, description, category, labels },
      user,
    );
  }

  @Delete('/:id')
  async deleteTask(
    @Param('id') id: number,
    @GetUser() user: User,
  ): Promise<void> {
    const task = await this.tasksService.getTaskById(id, user);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.cannot(Action.Delete, task)) {
      throw new ForbiddenException(
        `You are not allowed to delete the task "${task.title}" with ID "${task.id}"`,
      );
    }

    return this.tasksService.deleteTask(id, user);
  }

  @Patch('/:id/status')
  async updateTaskStatus(
    @Param('id') id: number,
    @Body('status') status: string,
    @GetUser() user: User,
  ): Promise<Task> {
    const taskStatus = status as TaskStatus;
    if (!Object.values(TaskStatus).includes(taskStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const task = await this.tasksService.getTaskById(id, user);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.cannot(Action.Update, task)) {
      throw new ForbiddenException(
        `You are not allowed to update the status of the task "${task.title}" with ID "${task.id}"`,
      );
    }

    return this.tasksService.updateTaskStatus(id, taskStatus, user);
  }

  @Patch('/:id/comment')
  async addComment(
    @Param('id') id: number,
    @Body('comment') comment: string,
    @GetUser() user: User,
  ): Promise<Task> {
    const task = await this.tasksService.getTaskById(id, user);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    if (ability.cannot(Action.Update, task)) {
      throw new ForbiddenException(
        `You are not allowed to add a comment to the task "${task.title}" with ID "${task.id}"`,
      );
    }

    return this.tasksService.addComment(id, user, comment);
  }
}
