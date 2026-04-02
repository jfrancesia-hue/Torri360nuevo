import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const categories = await this.prisma.category.findMany({
      where: { tenantId, parentId: null },
      include: {
        children: true,
        _count: { select: { tickets: true } },
      },
      orderBy: { name: 'asc' },
    });
    return { data: categories };
  }

  async create(tenantId: string, dto: { name: string; icon?: string; parentId?: string }) {
    const category = await this.prisma.category.create({
      data: { tenantId, ...dto },
    });
    return { data: category };
  }

  async update(tenantId: string, id: string, dto: { name?: string; icon?: string }) {
    const existing = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Categoría no encontrada');

    const category = await this.prisma.category.update({ where: { id }, data: dto });
    return { data: category };
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Categoría no encontrada');

    await this.prisma.category.delete({ where: { id } });
    return { data: { message: 'Categoría eliminada' } };
  }
}
