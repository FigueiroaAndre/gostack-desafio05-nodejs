import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import CreateCategoryIfNotExistsService from './CreateCategoryIfNotExistsService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();
    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Not enought balance to complete this transaction.');
    }

    const createCategory = new CreateCategoryIfNotExistsService();

    const { id: category_id } = await createCategory.execute(category);

    // let category_id: string;
    // const checkCategoriesExists = await categoriesRepository.findOne({
    // where: {
    // title: category,
    // },
    // });
    //
    // if (!checkCategoriesExists) {
    // const newCategory = categoriesRepository.create({
    // title: category,
    // });
    // await categoriesRepository.save(newCategory);
    // category_id = newCategory.id;
    // } else {
    // category_id = checkCategoriesExists.id;
    // }

    const newTransaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id,
    });

    await transactionsRepository.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
