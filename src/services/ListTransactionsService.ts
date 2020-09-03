import { getRepository, getCustomRepository } from 'typeorm';
import TransactionRepository, {
  Balance,
} from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface TransactionWithCategory {
  id: string;
  title: string;
  value: number;
  type: string;
  category: Category | undefined;
  created_at: Date;
  updated_at: Date;
}

interface Response {
  transactions: TransactionWithCategory[];
  balance: Balance;
}

class ListTransactionsService {
  public async execute(): Promise<Response> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const transactions = await transactionRepository.find();
    const responseTransactionsPromises = transactions.map(async transaction => {
      const {
        id,
        category_id,
        title,
        type,
        value,
        created_at,
        updated_at,
      } = transaction;
      const category = await categoryRepository.findOne({
        where: { id: category_id },
      });
      const responseTransaction = {
        id,
        title,
        value,
        type,
        category,
        updated_at,
        created_at,
      };
      return responseTransaction;
    });
    const responseTransactions = await Promise.all(
      responseTransactionsPromises,
    );

    const balance = await transactionRepository.getBalance();

    return {
      transactions: responseTransactions,
      balance,
    };
  }
}

export default ListTransactionsService;
