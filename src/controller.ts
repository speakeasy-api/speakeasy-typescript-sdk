export class MiddlewareController {
  private pathHint: string = "";
  private customerID: string = "";

  public getPathHint(): string {
    return this.pathHint;
  }

  public setPathHint(pathHint: string): void {
    this.pathHint = pathHint;
  }

  public getCustomerID(): string {
    return this.customerID;
  }

  public setCustomerID(customerID: string): void {
    this.customerID = customerID;
  }
}
