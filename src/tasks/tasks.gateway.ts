import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../auth/user.entity';
import { TasksService } from './tasks.service';
import { CaslAbilityFactory, Action } from '../auth/casl-ability.factory';

@WebSocketGateway({ namespace: '/tasks' })
@UseGuards(JwtAuthGuard)
export class TasksGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TasksGateway.name);

  constructor(
    private tasksService: TasksService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  afterInit(server: Server) {
    this.logger.log('TasksGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createTask')
  async handleCreateTask(
    @MessageBody() createTaskDto: any,
    @ConnectedSocket() client: Socket,
    @GetUser() user: User,
  ): Promise<void> {
    try {
      const ability = this.caslAbilityFactory.createForUser(user);

      if (ability.cannot(Action.Create, 'Task')) {
        this.logger.warn(
          `Unauthorized task creation attempt by user ${user.username}`,
        );
        client.emit('error', {
          message: 'You do not have permission to create a task.',
        });
        return;
      }

      const task = await this.tasksService.createTask(createTaskDto, user);
      this.server.emit('taskCreated', task);
    } catch (error) {
      this.logger.error(`Error creating task: ${error.message}`, error.stack);
      client.emit('error', {
        message: 'Failed to create task. Please try again later.',
      });
    }
  }

  @SubscribeMessage('updateTask')
  async handleUpdateTask(
    @MessageBody() updateTaskDto: any,
    @ConnectedSocket() client: Socket,
    @GetUser() user: User,
  ): Promise<void> {
    try {
      const { taskId, ...updateData } = updateTaskDto;
      const task = await this.tasksService.getTaskById(taskId, user);

      if (!task) {
        this.logger.warn(`Task not found: ${taskId}`);
        client.emit('error', { message: 'Task not found.' });
        return;
      }

      const ability = this.caslAbilityFactory.createForUser(user);

      if (ability.cannot(Action.Update, task)) {
        this.logger.warn(
          `Unauthorized task update attempt by user ${user.username}`,
        );
        client.emit('error', {
          message: 'You do not have permission to update this task.',
        });
        return;
      }

      const updatedTask = await this.tasksService.updateTaskStatus(
        taskId,
        updateData.status,
        user,
      );
      this.server.emit('taskUpdated', updatedTask);
    } catch (error) {
      this.logger.error(`Error updating task: ${error.message}`, error.stack);
      client.emit('error', {
        message: 'Failed to update task. Please try again later.',
      });
    }
  }

  @SubscribeMessage('deleteTask')
  async handleDeleteTask(
    @MessageBody() taskId: number,
    @ConnectedSocket() client: Socket,
    @GetUser() user: User,
  ): Promise<void> {
    try {
      const task = await this.tasksService.getTaskById(taskId, user);

      if (!task) {
        this.logger.warn(`Task not found: ${taskId}`);
        client.emit('error', { message: 'Task not found.' });
        return;
      }

      const ability = this.caslAbilityFactory.createForUser(user);

      if (ability.cannot(Action.Delete, task)) {
        this.logger.warn(
          `Unauthorized task deletion attempt by user ${user.username}`,
        );
        client.emit('error', {
          message: 'You do not have permission to delete this task.',
        });
        return;
      }

      await this.tasksService.deleteTask(taskId, user);
      this.server.emit('taskDeleted', { taskId });
    } catch (error) {
      this.logger.error(`Error deleting task: ${error.message}`, error.stack);
      client.emit('error', {
        message: 'Failed to delete task. Please try again later.',
      });
    }
  }
}
