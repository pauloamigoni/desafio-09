import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const customer = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(customer);

    return customer;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsFound = await this.ormRepository.findByIds(products);

    return productsFound;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsToBeUpdated = await this.findAllById(products);

    products.forEach(product => {
      const index = productsToBeUpdated.findIndex(p => p.id === product.id);
      const nQuantity = productsToBeUpdated[index].quantity - product.quantity;
      const productUpdated = {
        ...productsToBeUpdated[index],
        quantity: nQuantity,
      };
      productsToBeUpdated.splice(index, 1, productUpdated);
    });

    await this.ormRepository.save(productsToBeUpdated);

    return productsToBeUpdated;
  }
}

export default ProductsRepository;
