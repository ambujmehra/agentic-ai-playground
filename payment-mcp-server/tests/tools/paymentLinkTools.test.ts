import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PaymentLinkTools } from '../../src/mcp/tools/paymentLinkTools.js';
import { PaymentService } from '../../src/services/paymentService.js';
import { PaymentLinkStatus } from '../../src/mcp/types.js';

// Mock PaymentService
jest.mock('../../src/services/paymentService.js');

describe('PaymentLinkTools', () => {
  let paymentLinkTools: PaymentLinkTools;
  let mockPaymentService: jest.Mocked<PaymentService>;

  beforeEach(() => {
    mockPaymentService = new PaymentService() as jest.Mocked<PaymentService>;
    paymentLinkTools = new PaymentLinkTools(mockPaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTools', () => {
    test('should return all payment link tools', () => {
      const tools = paymentLinkTools.getAllTools();
      
      expect(tools).toHaveLength(7);
      expect(tools.map(t => t.name)).toEqual([
        'get_payment_links_list',
        'get_payment_link_by_id',
        'create_payment_link',
        'update_payment_link',
        'process_payment_link',
        'cancel_payment_link',
        'get_payment_links_by_status'
      ]);
    });

    test('should have proper tool schemas', () => {
      const tools = paymentLinkTools.getAllTools();
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      });
    });
  });

  describe('executePaymentLinkTool', () => {
    test('should execute get_payment_links_list tool', async () => {
      const mockResult = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      };
      mockPaymentService.getPaymentLinks.mockResolvedValue(mockResult);

      const result = await paymentLinkTools.executePaymentLinkTool('get_payment_links_list', {
        page: 0,
        size: 10
      });

      expect(result).toEqual(mockResult);
      expect(mockPaymentService.getPaymentLinks).toHaveBeenCalledWith(0, 10, 'createdAt', 'desc');
    });

    test('should execute get_payment_link_by_id tool', async () => {
      const mockPaymentLink = {
        id: 1,
        invoiceId: 'INV-001',
        amount: 100.00,
        status: PaymentLinkStatus.ACTIVE
      };
      mockPaymentService.getPaymentLinkById.mockResolvedValue(mockPaymentLink);

      const result = await paymentLinkTools.executePaymentLinkTool('get_payment_link_by_id', {
        id: 1
      });

      expect(result).toEqual(mockPaymentLink);
      expect(mockPaymentService.getPaymentLinkById).toHaveBeenCalledWith(1);
    });

    test('should execute create_payment_link tool', async () => {
      const mockPaymentLink = {
        id: 1,
        invoiceId: 'INV-001',
        amount: 100.00,
        status: PaymentLinkStatus.ACTIVE
      };
      mockPaymentService.createPaymentLink.mockResolvedValue(mockPaymentLink);

      const createData = {
        invoiceId: 'INV-001',
        invoiceNumber: 'INV-001',
        customerId: 'CUST-001',
        customerEmail: 'test@example.com',
        amount: 100.00,
        description: 'Test payment link'
      };

      const result = await paymentLinkTools.executePaymentLinkTool('create_payment_link', createData);

      expect(result).toEqual(mockPaymentLink);
      expect(mockPaymentService.createPaymentLink).toHaveBeenCalledWith(createData);
    });

    test('should execute update_payment_link tool', async () => {
      const mockPaymentLink = {
        id: 1,
        description: 'Updated description'
      };
      mockPaymentService.updatePaymentLink.mockResolvedValue(mockPaymentLink);

      const result = await paymentLinkTools.executePaymentLinkTool('update_payment_link', {
        id: 1,
        description: 'Updated description'
      });

      expect(result).toEqual(mockPaymentLink);
      expect(mockPaymentService.updatePaymentLink).toHaveBeenCalledWith(1, {
        description: 'Updated description'
      });
    });

    test('should execute process_payment_link tool', async () => {
      const mockPaymentLink = {
        id: 1,
        status: PaymentLinkStatus.PAID
      };
      mockPaymentService.processPaymentLink.mockResolvedValue(mockPaymentLink);

      const result = await paymentLinkTools.executePaymentLinkTool('process_payment_link', {
        id: 1
      });

      expect(result).toEqual(mockPaymentLink);
      expect(mockPaymentService.processPaymentLink).toHaveBeenCalledWith(1);
    });

    test('should execute cancel_payment_link tool', async () => {
      const mockPaymentLink = {
        id: 1,
        status: PaymentLinkStatus.CANCELLED
      };
      mockPaymentService.cancelPaymentLink.mockResolvedValue(mockPaymentLink);

      const result = await paymentLinkTools.executePaymentLinkTool('cancel_payment_link', {
        id: 1
      });

      expect(result).toEqual(mockPaymentLink);
      expect(mockPaymentService.cancelPaymentLink).toHaveBeenCalledWith(1);
    });

    test('should throw error for unknown tool', async () => {
      await expect(
        paymentLinkTools.executePaymentLinkTool('unknown_tool', {})
      ).rejects.toThrow('Unknown payment link tool: unknown_tool');
    });
  });
});
