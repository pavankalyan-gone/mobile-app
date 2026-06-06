import estimatorApi from './estimatorApi';

export interface ProductSuggestion {
  suggested_description: string;
  suggested_category: string;
}

export const productsService = {
  suggest: async (payload: { name: string; attributes?: string[] }): Promise<ProductSuggestion> => {
    const { data } = await estimatorApi.post('/products/suggest', payload);
    return data as ProductSuggestion;
  },
};
