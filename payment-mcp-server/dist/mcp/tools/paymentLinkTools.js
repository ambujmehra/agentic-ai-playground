import { z } from 'zod';
import { PaymentLinkCreateRequestSchema, PaymentLinkUpdateRequestSchema, PaymentLinkStatus } from '../types.js';
import { validateInput } from '../../utils/validation.js';
import { APIError } from '../../utils/errors.js';
export class PaymentLinkTools {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    getAllTools() {
        return [
            this.getPaymentLinksListTool(),
            this.getPaymentLinkByIdTool(),
            this.createPaymentLinkTool(),
            this.updatePaymentLinkTool(),
            this.processPaymentLinkTool(),
            this.cancelPaymentLinkTool(),
            this.getPaymentLinksByStatusTool()
        ];
    }
    getPaymentLinksListTool() {
        return {
            name: 'get_payment_links_list',
            description: 'Get a paginated list of all payment links with optional sorting and filtering',
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
                }
            }
        };
    }
    getPaymentLinkByIdTool() {
        return {
            name: 'get_payment_link_by_id',
            description: 'Get detailed information about a specific payment link by its ID',
            inputSchema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        description: 'Payment Link ID'
                    }
                },
                required: ['id']
            }
        };
    }
    createPaymentLinkTool() {
        return {
            name: 'create_payment_link',
            description: 'Create a new payment link with specified details',
            inputSchema: {
                type: 'object',
                properties: {
                    invoiceId: {
                        type: 'string',
                        description: 'Invoice ID for the payment link'
                    },
                    invoiceNumber: {
                        type: 'string',
                        description: 'Invoice number for the payment link'
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
                        description: 'Payment amount',
                        minimum: 0.01
                    },
                    currency: {
                        type: 'string',
                        description: 'Currency code (e.g., INR, USD)',
                        default: 'INR'
                    },
                    description: {
                        type: 'string',
                        description: 'Payment link description'
                    },
                    expiryHours: {
                        type: 'number',
                        description: 'Expiry time in hours from creation',
                        minimum: 1,
                        default: 24
                    },
                    notifyCustomer: {
                        type: 'boolean',
                        description: 'Whether to notify customer via email',
                        default: true
                    },
                    redirectUrl: {
                        type: 'string',
                        description: 'URL to redirect after payment completion'
                    },
                    webhookUrl: {
                        type: 'string',
                        description: 'Webhook URL for payment notifications'
                    }
                },
                required: ['invoiceId', 'invoiceNumber', 'customerId', 'customerEmail', 'amount', 'description']
            }
        };
    }
    updatePaymentLinkTool() {
        return {
            name: 'update_payment_link',
            description: 'Update an existing payment link',
            inputSchema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        description: 'Payment Link ID'
                    },
                    description: {
                        type: 'string',
                        description: 'Updated payment link description'
                    },
                    expiryHours: {
                        type: 'number',
                        description: 'Updated expiry time in hours',
                        minimum: 1
                    },
                    notifyCustomer: {
                        type: 'boolean',
                        description: 'Whether to notify customer via email'
                    },
                    redirectUrl: {
                        type: 'string',
                        description: 'Updated redirect URL'
                    },
                    webhookUrl: {
                        type: 'string',
                        description: 'Updated webhook URL'
                    }
                },
                required: ['id']
            }
        };
    }
    processPaymentLinkTool() {
        return {
            name: 'process_payment_link',
            description: 'Process a payment link (mark as PAID when payment is received)',
            inputSchema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        description: 'Payment Link ID to process'
                    }
                },
                required: ['id']
            }
        };
    }
    cancelPaymentLinkTool() {
        return {
            name: 'cancel_payment_link',
            description: 'Cancel an active payment link',
            inputSchema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        description: 'Payment Link ID to cancel'
                    }
                },
                required: ['id']
            }
        };
    }
    getPaymentLinksByStatusTool() {
        return {
            name: 'get_payment_links_by_status',
            description: 'Get all payment links with a specific status',
            inputSchema: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        description: 'Payment link status to filter by',
                        enum: Object.values(PaymentLinkStatus)
                    },
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
                    }
                },
                required: ['status']
            }
        };
    }
    async executePaymentLinkTool(name, arguments_) {
        try {
            switch (name) {
                case 'get_payment_links_list':
                    return await this.handleGetPaymentLinksList(arguments_);
                case 'get_payment_link_by_id':
                    return await this.handleGetPaymentLinkById(arguments_);
                case 'create_payment_link':
                    return await this.handleCreatePaymentLink(arguments_);
                case 'update_payment_link':
                    return await this.handleUpdatePaymentLink(arguments_);
                case 'process_payment_link':
                    return await this.handleProcessPaymentLink(arguments_);
                case 'cancel_payment_link':
                    return await this.handleCancelPaymentLink(arguments_);
                case 'get_payment_links_by_status':
                    return await this.handleGetPaymentLinksByStatus(arguments_);
                default:
                    throw new APIError(`Unknown payment link tool: ${name}`, 400);
            }
        }
        catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError(`Error executing payment link tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    async handleGetPaymentLinksList(args) {
        const validatedArgs = validateInput(z.object({
            page: z.number().min(0).default(0),
            size: z.number().min(1).max(100).default(10),
            sortBy: z.enum(['id', 'amount', 'createdAt', 'status', 'customerEmail']).default('createdAt'),
            sortDirection: z.enum(['asc', 'desc']).default('desc')
        }), args);
        // Use getAllPaymentLinks since that's what's available
        const allLinks = await this.paymentService.getAllPaymentLinks();
        // Simulate pagination for now
        const startIndex = (validatedArgs.page ?? 0) * (validatedArgs.size ?? 10);
        const endIndex = startIndex + (validatedArgs.size ?? 10);
        const paginatedLinks = allLinks.slice(startIndex, endIndex);
        return {
            content: paginatedLinks,
            totalElements: allLinks.length,
            totalPages: Math.ceil(allLinks.length / (validatedArgs.size ?? 10)),
            size: validatedArgs.size ?? 10,
            number: validatedArgs.page ?? 0
        };
    }
    async handleGetPaymentLinkById(args) {
        const validatedArgs = validateInput(z.object({
            id: z.number()
        }), args);
        return await this.paymentService.getPaymentLinkById(validatedArgs.id.toString());
    }
    async handleCreatePaymentLink(args) {
        const validatedArgs = validateInput(PaymentLinkCreateRequestSchema, args);
        // Map the tool arguments to service method arguments
        const paymentLinkData = {
            invoiceId: validatedArgs.invoiceId,
            invoiceNumber: validatedArgs.invoiceNumber,
            customerEmail: validatedArgs.customerEmail,
            amount: validatedArgs.amount,
            currency: validatedArgs.currency ?? 'INR',
            description: validatedArgs.description,
            expiryHours: validatedArgs.expiryHours ?? 24
        };
        return await this.paymentService.createPaymentLink(paymentLinkData);
    }
    async handleUpdatePaymentLink(args) {
        const validatedArgs = validateInput(z.object({
            id: z.number()
        }).merge(PaymentLinkUpdateRequestSchema), args);
        // Since PaymentService doesn't have updatePaymentLink, we'll throw an error for now
        throw new APIError('Payment link updates are not supported yet', 501);
    }
    async handleProcessPaymentLink(args) {
        const validatedArgs = validateInput(z.object({
            id: z.number()
        }), args);
        return await this.paymentService.processPaymentLink(validatedArgs.id.toString());
    }
    async handleCancelPaymentLink(args) {
        const validatedArgs = validateInput(z.object({
            id: z.number()
        }), args);
        return await this.paymentService.cancelPaymentLink(validatedArgs.id.toString());
    }
    async handleGetPaymentLinksByStatus(args) {
        const validatedArgs = validateInput(z.object({
            status: z.nativeEnum(PaymentLinkStatus),
            page: z.number().min(0).default(0),
            size: z.number().min(1).max(100).default(10)
        }), args);
        // Get all links and filter by status since service doesn't have this method
        const allLinks = await this.paymentService.getAllPaymentLinks();
        const filteredLinks = allLinks.filter((link) => link.status === validatedArgs.status);
        // Simulate pagination
        const startIndex = (validatedArgs.page ?? 0) * (validatedArgs.size ?? 10);
        const endIndex = startIndex + (validatedArgs.size ?? 10);
        const paginatedLinks = filteredLinks.slice(startIndex, endIndex);
        return {
            content: paginatedLinks,
            totalElements: filteredLinks.length,
            totalPages: Math.ceil(filteredLinks.length / (validatedArgs.size ?? 10)),
            size: validatedArgs.size ?? 10,
            number: validatedArgs.page ?? 0
        };
    }
}
//# sourceMappingURL=paymentLinkTools.js.map