import { ProductType } from "@models"
import {
  Context,
  CreateProductTypeDTO,
  DAL,
  FindConfig,
  ProductTypes
} from "@medusajs/types"
import { ProductTypeRepository } from "@repositories"
import {
  InjectTransactionManager,
  MedusaContext,
  ModulesSdkUtils,
  retrieveEntity,
} from "@medusajs/utils"

import { doNotForceTransaction } from "../utils"

type InjectedDependencies = {
  productTypeRepository: DAL.RepositoryService
}

export default class ProductTypeService<
  TEntity extends ProductType = ProductType
> {
  protected readonly productTypeRepository_: DAL.RepositoryService

  constructor({ productTypeRepository }: InjectedDependencies) {
    this.productTypeRepository_ = productTypeRepository
  }

  async retrieve(
    productTypeId: string,
    config: FindConfig<ProductTypes.ProductTypeDTO> = {},
    sharedContext?: Context
  ): Promise<TEntity> {
    return (await retrieveEntity<
      ProductType,
      ProductTypes.ProductTypeDTO
    >({
      id: productTypeId,
      entityName: ProductType.name,
      repository: this.productTypeRepository_,
      config,
      sharedContext,
    })) as TEntity
  }

  async list(
    filters: ProductTypes.FilterableProductTypeProps = {},
    config: FindConfig<ProductTypes.ProductTypeDTO> = {},
    sharedContext?: Context
  ): Promise<TEntity[]> {
    return (await this.productTypeRepository_.find(
      this.buildQueryForList(filters, config),
      sharedContext
    )) as TEntity[]
  }

  async listAndCount(
    filters: ProductTypes.FilterableProductTypeProps = {},
    config: FindConfig<ProductTypes.ProductTypeDTO> = {},
    sharedContext?: Context
  ): Promise<[TEntity[], number]> {
    return (await this.productTypeRepository_.findAndCount(
      this.buildQueryForList(filters, config),
      sharedContext
    )) as [TEntity[], number]
  }

  private buildQueryForList(
    filters: ProductTypes.FilterableProductTypeProps = {},
    config: FindConfig<ProductTypes.ProductTypeDTO> = {},
  ) {
    const queryOptions = ModulesSdkUtils.buildQuery<ProductType>(filters, config)

    if (filters.value) {
      queryOptions.where["value"] = { $ilike: filters.value }
    }

    return queryOptions
  }

  @InjectTransactionManager(doNotForceTransaction, "productTypeRepository_")
  async upsert(
    types: CreateProductTypeDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<TEntity[]> {
    return (await (this.productTypeRepository_ as ProductTypeRepository)
      .upsert!(types, sharedContext)) as TEntity[]
  }
}
