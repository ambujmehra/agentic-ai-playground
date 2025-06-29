export declare class ROPMCPServer {
    private server;
    private roService;
    constructor();
    private setupHandlers;
    private handleListRepairOrders;
    private handleGetRepairOrder;
    private handleGetRepairOrderByNumber;
    private handleCreateRepairOrder;
    private handleUpdateRepairOrder;
    private handleUpdateRepairOrderStatus;
    private handleDeleteRepairOrder;
    private handleGetRepairOrdersByStatus;
    private handleGetRepairOrdersByTechnician;
    private handleGetRepairOrdersByVehicle;
    private handleAddPartToRepairOrder;
    private handleGetRepairOrderStats;
    run(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map