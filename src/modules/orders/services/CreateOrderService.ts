import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';
import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Invalid customer');
    }

    const checkQuantityInvalid = products.some(
      product => product.quantity <= 0,
    );

    if (checkQuantityInvalid) {
      throw new AppError('The quantity must be greater than zero');
    }

    const allProducts = await this.productsRepository.findAllById(products);

    if (products.length !== allProducts.length) {
      throw new AppError('Invalid product(s)');
    }

    const withoutStock = allProducts.some(product => {
      let pQuantity = products.find(p => p.id === product.id)?.quantity;
      if (!pQuantity) pQuantity = 0;
      return product.quantity - pQuantity <= 0;
    });

    if (withoutStock) {
      throw new AppError('There are products with insufficient quantities');
    }

    const verifiedProducts = allProducts.map(product => ({
      product_id: product.id,
      price: product.price,
      quantity: products.find(p => p.id === product.id)?.quantity || 0,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: verifiedProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateProductService;
