import csvParse from 'csv-parse';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import CreateCategoryIfNotExistsService from './CreateCategoryIfNotExistsService';
import Category from '../models/Category';

const categoryIndex = 3;

class ImportTransactionsService {
  async execute(file: any): Promise<void> {
    const csvParser = csvParse(file.buffer, {
      from_line: 2,
    });
    const transactionsDataFromCSV: Array<Array<any>> = [];

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
      categoryPromises.push(createCategory.execute(category));
    });
    await Promise.all(categoryPromises);

    const transactionPromises: Promise<Transaction>[] = [];

    transactionsDataFromCSV.forEach(transactionRow => {
      const createTransaction = new CreateTransactionService();
      const [title, type, value, category] = transactionRow;
      const newTransaction = createTransaction.execute({
        title,
        type,
        value,
        category,
      });
      transactionPromises.push(newTransaction);
    });
    await Promise.all(transactionPromises);
  }
}

export default ImportTransactionsService;
