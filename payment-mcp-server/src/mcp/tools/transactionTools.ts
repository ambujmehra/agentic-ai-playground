import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PaymentService } from '../../services/paymentService.js';
import { 
  TransactionCreateRequestSchema, 
  TransactionUpdateStatusRequestSchema,
  TransactionStatus,
  PaymentType,
  CardType
} from '../types.js';
import { validateInput } from '../../utils/validation.js';
import { APIError } from '../../utils/errors.js';

export class TransactionTools {
  constructor(private paymentService: PaymentService) {}

  getAllTools(): Tool[] {
    return [
      this.getTransactionsListTool(),
      this.getTransactionByIdTool(),
      this.createTransactionTool(),
      this.updateTransactionStatusTool(),
      this.processTransactionTool(),
      this.getTransactionsByCustomerTool(),
      this.getTransactionsByStatusTool(),
      this.getTransactionsByPaymentTypeTool(),
      this.getTransactionsByCardTypeTool(),
      this.getAllCardTypesTool(),
      this.getAllPaymentTypesTool()
    ];
  }

  private getTransactionsListTool(): Tool {
    return {
      name: 'get_transactions_list',
      description: 'Get a paginated list of all transactions with optional sorting and filtering',
      inputSchema: {
        type: 'object',
        properties: {
          page: {
            type: 'number',
            description: 'Page number (0-based)',
            default: 0,
            minimum: 0
          },
          size: {
            type: 'number',
            description: 'Number of items per page',
            default: 10,
            minimum: 1,
            maximum: 100
          },
          sortBy: {
            type: 'string',
            description: 'Field to sort by',
            enum: ['id', 'amount', 'createdAt', 'status', 'customerEmail'],
            default: 'createdAt'
          },
          sortDirection: {
            type: 'string',
            description: 'Sort direction',
            enum: ['asc', 'desc'],
            default: 'desc'
          }
        },
        required: []
      }
    };
  }

  private getTransactionByIdTool(): Tool {
    return {
      name: 'get_transaction_by_id',
      description: 'Get detailed information about a specific transaction by its ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Transaction ID'
          }
        },
        required: ['id']
      }
    };
  }

  private createTransactionTool(): Tool {
    return {
      name: 'create_transaction',
      description: 'Create a new transaction with specified details',
      inputSchema: {
        type: 'object',
        properties: {
          invoiceId: {
            type: 'string',
            description: 'Invoice ID for the transaction'
          },
          invoiceNumber: {
            type: 'string',
            description: 'Invoice number for the transaction'
          },
          customerId: {
            type: 'string',
            description: 'Customer ID'
          },
          customerEmail: {
            type: 'string',
            description: 'Customer email address',
            format: 'email'
          },
          amount: {
            type: 'number',
            description: 'Transaction amount',
            minimum: 0.01
          },
          currency: {
            type: 'string',
            description: 'Currency code (e.g., INR, USD)',
            default: 'INR'
          },
          paymentType: {
            type: 'string',
            description: 'Payment type',
            enum: Object.values(PaymentType)
          },
          cardType: {
            type: 'string',
            description: 'Card type (if applicable)',
            enum: Object.values(CardType)
          },
          description: {
            type: 'string',
            description: 'Transaction description'
          }
        },
        required: ['invoiceId', 'invoiceNumber', 'customerId', 'customerEmail', 'amount', 'paymentType', 'description']
      }
    };
  }

  private updateTransactionStatusTool(): Tool {
    return {
      name: 'update_transaction_status',
      description: 'Update the status of an existing transaction',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Transaction ID'
          },
          status: {
            type: 'string',
            description: 'New transaction status',
            enum: Object.values(TransactionStatus)
          }
        },
        required: ['id', 'status']
      }
    };
  }

  private processTransactionTool(): Tool {
    return {
      name: 'process_transaction',
      description: 'Process a transaction (updates status to CAPTURED)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Transaction ID to process'
          }
        },
        required: ['id']
      }
    };
  }

  private getTransactionsByCustomerTool(): Tool {
    return {
      name: 'get_transactions_by_customer',
      description: 'Get all transactions for a specific customer by email',
      inputSchema: {
        type: 'object',
        properties: {
          customerEmail: {
            type: 'string',
            description: 'Customer email address',
            format: 'email'
          }
        },
        required: ['customerEmail']
      }
    };
  }

  private getTransactionsByStatusTool(): Tool {
    return {
      name: 'get_transactions_by_status',
      description: 'Get all transactions with a specific status',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Transaction status to filter by',
            enum: Object.values(TransactionStatus)
          }
        },
        required: ['status']
      }
    };
  }

  private getTransactionsByPaymentTypeTool(): Tool {
    return {
      name: 'get_transactions_by_payment_type',
      description: 'Get all transactions with a specific payment type',
      inputSchema: {
        type: 'object',
        properties: {
          paymentType: {
            type: 'string',
            description: 'Payment type to filter by',
            enum: Object.values(PaymentType)
          }
        },
        required: ['paymentType']
      }
    };
  }

  private getTransactionsByCardTypeTool(): Tool {
    return {
      name: 'get_transactions_by_card_type',
      description: 'Get all transactions with a specific card type',
      inputSchema: {
        type: 'object',
        properties: {
          cardType: {
            type: 'string',
            description: 'Card type to filter by',
            enum: Object.values(CardType)
          }
        },
        required: ['cardType']
      }
    };
  }

  async executeTransactionTool(name: string, arguments_: any): Promise<any> {
    try {
      switch (name) {
        case 'get_transactions_list':
          return await this.handleGetTransactionsList(arguments_);
        
        case 'get_transaction_by_id':
          return await this.handleGetTransactionById(arguments_);
        
        case 'create_transaction':
          return await this.handleCreateTransaction(arguments_);
        
        case 'update_transaction_status':
          return await this.handleUpdateTransactionStatus(arguments_);
        
        case 'process_transaction':
          return await this.handleProcessTransaction(arguments_);
        
        case 'get_transactions_by_customer':
          return await this.handleGetTransactionsByCustomer(arguments_);
        
        case 'get_transactions_by_status':
          return await this.handleGetTransactionsByStatus(arguments_);
        
        case 'get_transactions_by_payment_type':
          return await this.handleGetTransactionsByPaymentType(arguments_);
        
        case 'get_transactions_by_card_type':
          return await this.handleGetTransactionsByCardType(arguments_);
        
        case 'get_all_card_types':
          return await this.handleGetAllCardTypes(arguments_);
        
        case 'get_all_payment_types':
          return await this.handleGetAllPaymentTypes(arguments_);
        
        default:
          throw new APIError(`Unknown transaction tool: ${name}`, 400);
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(`Error executing transaction tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  private async handleGetTransactionsList(args: any) {
    const validatedArgs = validateInput(z.object({
      page: z.number().min(0).default(0),
      size: z.number().min(1).max(100).default(10),
      sortBy: z.enum(['id', 'amount', 'createdAt', 'status', 'customerEmail']).default('createdAt'),
      sortDirection: z.enum(['asc', 'desc']).default('desc')
    }), args);

    return await this.paymentService.getAllTransactions({
      page: validatedArgs.page ?? 0,
      size: validatedArgs.size ?? 10,
      sortBy: validatedArgs.sortBy ?? 'createdAt',
      sortDirection: validatedArgs.sortDirection ?? 'desc'
    });
  }

  private async handleGetTransactionById(args: any) {
    const validatedArgs = validateInput(z.object({
      id: z.number()
    }), args);

    return await this.paymentService.getTransactionById(validatedArgs.id);
  }

  private async handleCreateTransaction(args: any) {
    const validatedArgs = validateInput(TransactionCreateRequestSchema, args);
    // Ensure all required fields are present with proper defaults
    const transactionData = {
      invoiceId: validatedArgs.invoiceId,
      invoiceNumber: validatedArgs.invoiceNumber,
      customerId: validatedArgs.customerId,
      customerEmail: validatedArgs.customerEmail,
      amount: validatedArgs.amount,
      currency: validatedArgs.currency ?? 'INR',
      paymentType: validatedArgs.paymentType,
      cardType: validatedArgs.cardType,
      description: validatedArgs.description
    };
    return await this.paymentService.createTransaction(transactionData);
  }

  private async handleUpdateTransactionStatus(args: any) {
    const validatedArgs = validateInput(z.object({
      id: z.number(),
      status: z.nativeEnum(TransactionStatus)
    }), args);

    return await this.paymentService.updateTransactionStatus(validatedArgs.id, validatedArgs.status);
  }

  private async handleProcessTransaction(args: any) {
    const validatedArgs = validateInput(z.object({
      id: z.number()
    }), args);

    return await this.paymentService.processTransaction(validatedArgs.id);
  }

  private async handleGetTransactionsByCustomer(args: any) {
    const validatedArgs = validateInput(z.object({
      customerEmail: z.string().email()
    }), args);

    return await this.paymentService.searchTransactionsByCustomer(validatedArgs.customerEmail);
  }

  private async handleGetTransactionsByStatus(args: any) {
    const validatedArgs = validateInput(z.object({
      status: z.nativeEnum(TransactionStatus)
    }), args);

    return await this.paymentService.searchTransactionsByStatus(validatedArgs.status);
  }

  private async handleGetTransactionsByPaymentType(args: any) {
    const validatedArgs = validateInput(z.object({
      paymentType: z.nativeEnum(PaymentType)
    }), args);

    return await this.paymentService.searchTransactionsByPaymentType(validatedArgs.paymentType);
  }

  private async handleGetTransactionsByCardType(args: any) {
    const validatedArgs = validateInput(z.object({
      cardType: z.nativeEnum(CardType)
    }), args);

    return await this.paymentService.searchTransactionsByCardType(validatedArgs.cardType);
  }

  private getAllCardTypesTool(): Tool {
    return {
      name: 'get_all_card_types',
      description: 'Get all available card types in the payment system',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  private getAllPaymentTypesTool(): Tool {
    return {
      name: 'get_all_payment_types',
      description: 'Get all available payment types in the payment system',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  private async handleGetAllCardTypes(args: any) {
    return await this.paymentService.getAllCardTypes();
  }

  private async handleGetAllPaymentTypes(args: any) {
    return await this.paymentService.getAllPaymentTypes();
  }
}
