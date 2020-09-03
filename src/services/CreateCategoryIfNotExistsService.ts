import { getRepository } from 'typeorm';

import Category from '../models/Category';

class CreateCategoryIfNotExistsService {
  public async execute(title: string): Promise<Category> {
    const categoriesRepository = getRepository(Category);

    const checkCategoriesExists = await categoriesRepository.findOne({
      where: {
        title,
      },
    });

    if (!checkCategoriesExists) {
      const newCategory = categoriesRepository.create({
        title,
      });
      await categoriesRepository.save(newCategory);
      return newCategory;
    }
    return checkCategoriesExists;
  }
}

export default CreateCategoryIfNotExistsService;
