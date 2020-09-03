import csvParse from 'csv-parse';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository, {
  Balance,
} from '../repositories/TransactionsRepository';
import CreateTransactionService from './CreateTransactionService';
import CreateCategoryIfNotExistsService from './CreateCategoryIfNotExistsService';
import Category from '../models/Category';
import AppError from '../errors/AppError';

const categoryIndex = 3;
const typeIndex = 1;
const valueIndex = 2;

async function processingCSVArray(
  transactionArray: Array<[string, string, number, string]>,
) {
  const promisesArray: Promise<Transaction>[] = [];

  transactionArray.forEach(transactionRow => {
    const createTransaction = new CreateTransactionService();
    const [title, type, value, category] = transactionRow;
    const newTransaction = createTransaction.execute({
      title: title.trim(),
      type: type.trim(),
      value,
      category: category.trim(),
    });
    promisesArray.push(newTransaction);
  });
  await Promise.all(promisesArray);
}

class ImportTransactionsService {
  async execute(file: any): Promise<void> {
    const csvParser = csvParse(file.buffer, {
      from_line: 2,
    });
    const transactionsDataFromCSV: Array<[string, string, number, string]> = [];

    csvParser.on('data', line => {
      transactionsDataFromCSV.push(line);
    });

    await new Promise(resolve => csvParser.on('end', resolve));

    const categoriesSet: Set<string> = new Set();

    transactionsDataFromCSV.forEach(transaction =>
      categoriesSet.add(transaction[categoryIndex]),
    );

    const createCategory = new CreateCategoryIfNotExistsService();

    const categoryPromises: Promise<Category>[] = [];
    categoriesSet.forEach(category => {
      categoryPromises.push(createCategory.execute(category.trim()));
    });
    await Promise.all(categoryPromises);

    const csvBalance = transactionsDataFromCSV.reduce(
      (accumulator: Balance, transaction) => {
        if (transaction[typeIndex].trim() === 'income') {
          accumulator.income += transaction[valueIndex];
        } else {
          accumulator.outcome += transaction[valueIndex];
        }
        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );
    csvBalance.total = csvBalance.income - csvBalance.outcome;

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const dbBalance = await transactionsRepository.getBalance();

    if (csvBalance.total + dbBalance.total < 0) {
      throw new AppError(
        "The total balance wouldn't be enought after all the transactions.",
      );
    }

    const incomeTransactionsFromCSV = transactionsDataFromCSV.filter(
      transaction => transaction[typeIndex].trim() === 'income',
    );

    await processingCSVArray(incomeTransactionsFromCSV);

    const outcomeTransactionsFromCSV = transactionsDataFromCSV.filter(
      transaction => transaction[typeIndex].trim() === 'outcome',
    );

    await processingCSVArray(outcomeTransactionsFromCSV);
  }
}

export default ImportTransactionsService;
