import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TransactionTools } from '../../src/mcp/tools/transactionTools.js';
import { PaymentService } from '../../src/services/paymentService.js';
import { TransactionStatus, PaymentType, CardType } from '../../src/mcp/types.js';

// Mock PaymentService
jest.mock('../../src/services/paymentService.js');

describe('TransactionTools', () => {
  let transactionTools: TransactionTools;
  let mockPaymentService: jest.Mocked<PaymentService>;

  beforeEach(() => {
    mockPaymentService = new PaymentService() as jest.Mocked<PaymentService>;
    transactionTools = new TransactionTools(mockPaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTools', () => {
    test('should return all transaction tools', () => {
      const tools = transactionTools.getAllTools();
      
      expect(tools).toHaveLength(9);
      expect(tools.map(t => t.name)).toEqual([
        'get_transactions_list',
        'get_transaction_by_id',
        'create_transaction',
        'update_transaction_status',
        'process_transaction',
        'get_transactions_by_customer',
        'get_transactions_by_status',
        'get_transactions_by_payment_type',
        'get_transactions_by_card_type'
      ]);
    });

    test('should have proper tool schemas', () => {
      const tools = transactionTools.getAllTools();
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      });
    });
  });

  describe('executeTransactionTool', () => {
    test('should execute get_transactions_list tool', async () => {
      const mockResult = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      };
      mockPaymentService.getTransactions.mockResolvedValue(mockResult);

      const result = await transactionTools.executeTransactionTool('get_transactions_list', {
        page: 0,
        size: 10
      });

      expect(result).toEqual(mockResult);
      expect(mockPaymentService.getTransactions).toHaveBeenCalledWith(0, 10, 'createdAt', 'desc');
    });

    test('should execute get_transaction_by_id tool', async () => {
      const mockTransaction = {
        id: 1,
        invoiceId: 'INV-001',
        amount: 100.00,
        status: TransactionStatus.PENDING
      };
      mockPaymentService.getTransactionById.mockResolvedValue(mockTransaction);

      const result = await transactionTools.executeTransactionTool('get_transaction_by_id', {
        id: 1
      });

      expect(result).toEqual(mockTransaction);
      expect(mockPaymentService.getTransactionById).toHaveBeenCalledWith(1);
    });

    test('should execute create_transaction tool', async () => {
      const mockTransaction = {
        id: 1,
        invoiceId: 'INV-001',
        amount: 100.00,
        status: TransactionStatus.PENDING
      };
      mockPaymentService.createTransaction.mockResolvedValue(mockTransaction);

      const createData = {
        invoiceId: 'INV-001',
        invoiceNumber: 'INV-001',
        customerId: 'CUST-001',
        customerEmail: 'test@example.com',
        amount: 100.00,
        paymentType: PaymentType.CREDIT_CARD,
        description: 'Test transaction'
      };

      const result = await transactionTools.executeTransactionTool('create_transaction', createData);

      expect(result).toEqual(mockTransaction);
      expect(mockPaymentService.createTransaction).toHaveBeenCalledWith(createData);
    });

    test('should execute update_transaction_status tool', async () => {
      const mockTransaction = {
        id: 1,
        status: TransactionStatus.CAPTURED
      };
      mockPaymentService.updateTransactionStatus.mockResolvedValue(mockTransaction);

      const result = await transactionTools.executeTransactionTool('update_transaction_status', {
        id: 1,
        status: TransactionStatus.CAPTURED
      });

      expect(result).toEqual(mockTransaction);
      expect(mockPaymentService.updateTransactionStatus).toHaveBeenCalledWith(1, TransactionStatus.CAPTURED);
    });

    test('should execute process_transaction tool', async () => {
      const mockTransaction = {
        id: 1,
        status: TransactionStatus.CAPTURED
      };
      mockPaymentService.processTransaction.mockResolvedValue(mockTransaction);

      const result = await transactionTools.executeTransactionTool('process_transaction', {
        id: 1
      });

      expect(result).toEqual(mockTransaction);
      expect(mockPaymentService.processTransaction).toHaveBeenCalledWith(1);
    });

    test('should throw error for unknown tool', async () => {
      await expect(
        transactionTools.executeTransactionTool('unknown_tool', {})
      ).rejects.toThrow('Unknown transaction tool: unknown_tool');
    });

    test('should handle validation errors', async () => {
      await expect(
        transactionTools.executeTransactionTool('get_transaction_by_id', {
          id: 'invalid'
        })
      ).rejects.toThrow();
    });
  });

  describe('tool argument validation', () => {
    test('should validate get_transactions_list arguments', async () => {
      mockPaymentService.getTransactions.mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      });

      // Test with invalid page number
      await expect(
        transactionTools.executeTransactionTool('get_transactions_list', {
          page: -1
        })
      ).rejects.toThrow();

      // Test with invalid size
      await expect(
        transactionTools.executeTransactionTool('get_transactions_list', {
          size: 0
        })
      ).rejects.toThrow();

      // Test with valid arguments
      await transactionTools.executeTransactionTool('get_transactions_list', {
        page: 0,
        size: 10,
        sortBy: 'amount',
        sortDirection: 'asc'
      });

      expect(mockPaymentService.getTransactions).toHaveBeenCalledWith(0, 10, 'amount', 'asc');
    });

    test('should validate create_transaction arguments', async () => {
      // Test missing required fields
      await expect(
        transactionTools.executeTransactionTool('create_transaction', {
          invoiceId: 'INV-001'
        })
      ).rejects.toThrow();

      // Test invalid email
      await expect(
        transactionTools.executeTransactionTool('create_transaction', {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-001',
          customerId: 'CUST-001',
          customerEmail: 'invalid-email',
          amount: 100.00,
          paymentType: PaymentType.CREDIT_CARD,
          description: 'Test'
        })
      ).rejects.toThrow();

      // Test invalid amount
      await expect(
        transactionTools.executeTransactionTool('create_transaction', {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-001',
          customerId: 'CUST-001',
          customerEmail: 'test@example.com',
          amount: -1,
          paymentType: PaymentType.CREDIT_CARD,
          description: 'Test'
        })
      ).rejects.toThrow();
    });
  });
});
