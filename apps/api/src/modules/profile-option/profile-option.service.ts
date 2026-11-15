import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ErrorCode } from '@online-school/shared-types';
import { ProfileOption, ProfileOptionCategory } from './entities/profile-option.entity.js';
import {
  CreateProfileOptionDto,
  QueryProfileOptionsDto,
  UpdateProfileOptionDto,
} from './dto/profile-option.dto.js';

/** 分类展示顺序 */
const CATEGORY_ORDER: ProfileOptionCategory[] = [
  ProfileOptionCategory.GRADE,
  ProfileOptionCategory.MAJOR,
  ProfileOptionCategory.UNIVERSITY,
];

@Injectable()
export class ProfileOptionService {
  constructor(
    @InjectRepository(ProfileOption)
    private readonly optionRepo: Repository<ProfileOption>,
  ) {}

  /**
   * 管理端：查询全部选项（可按分类过滤）
   */
  async findAll(query: QueryProfileOptionsDto): Promise<ProfileOption[]> {
    const where = query.category ? { category: query.category } : {};
    const list = await this.optionRepo.find({ where });
    // 分类固定顺序 + 排序值升序 + id 升序
    return list.sort((a, b) => {
      const categoryDiff =
        CATEGORY_ORDER.indexOf(a.category as ProfileOptionCategory) -
        CATEGORY_ORDER.indexOf(b.category as ProfileOptionCategory);
      if (categoryDiff !== 0) return categoryDiff;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  }

  /**
   * 小程序端：查询已启用选项（按分类分组）
   */
  async findEnabledGrouped(): Promise<Record<string, ProfileOption[]>> {
    const list = await this.optionRepo.find({
      where: { is_enabled: true, category: In(CATEGORY_ORDER) },
      order: { sort_order: 'ASC', id: 'ASC' },
    });

    const grouped: Record<string, ProfileOption[]> = {};
    for (const category of CATEGORY_ORDER) {
      grouped[category] = [];
    }
    for (const option of list) {
      grouped[option.category].push(option);
    }
    return grouped;
  }

  /**
   * 创建选项（同一分类下名称不可重复）
   */
  async create(dto: CreateProfileOptionDto): Promise<ProfileOption> {
    await this.assertNameAvailable(dto.category, dto.name.trim());

    const option = this.optionRepo.create({
      ...dto,
      name: dto.name.trim(),
      is_enabled: dto.is_enabled ?? true,
    });
    return this.optionRepo.save(option);
  }

  /**
   * 更新选项
   */
  async update(id: number, dto: UpdateProfileOptionDto): Promise<ProfileOption> {
    const option = await this.optionRepo.findOne({ where: { id } });
    if (!option) {
      throw new NotFoundException({
        code: ErrorCode.PROFILE_OPTION_NOT_FOUND,
        message: '选项不存在',
      });
    }

    const nextCategory = dto.category ?? option.category;
    const nextName = dto.name !== undefined ? dto.name.trim() : option.name;

    if (nextCategory !== option.category || nextName !== option.name) {
      await this.assertNameAvailable(nextCategory, nextName, id);
    }

    Object.assign(option, dto, { category: nextCategory, name: nextName });
    return this.optionRepo.save(option);
  }

  /**
   * 删除选项
   */
  async remove(id: number): Promise<void> {
    const option = await this.optionRepo.findOne({ where: { id } });
    if (!option) {
      throw new NotFoundException({
        code: ErrorCode.PROFILE_OPTION_NOT_FOUND,
        message: '选项不存在',
      });
    }
    await this.optionRepo.remove(option);
  }

  /**
   * 校验同一分类下名称唯一（excludeId 用于更新时排除自身）
   */
  private async assertNameAvailable(category: string, name: string, excludeId?: number) {
    const existing = await this.optionRepo.findOne({ where: { category, name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException({
        code: ErrorCode.PROFILE_OPTION_EXISTS,
        message: '同一分类下的选项名称不可重复',
      });
    }
  }
}
