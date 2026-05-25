import { elasticsearchRequest } from "../config/elasticsearch.js";
import Food from "../models/Food.js";

const FOOD_INDEX = "foods";

const foodIndexMapping = {
  mappings: {
    properties: {
      id: { type: "keyword" },
      name: {
        type: "text",
        fields: {
          keyword: { type: "keyword" },
        },
      },
      category: {
        type: "text",
        fields: {
          keyword: { type: "keyword" },
        },
      },
      shop: {
        type: "text",
        fields: {
          keyword: { type: "keyword" },
        },
      },
      UrlImg: { type: "keyword" },
      isAvailble: { type: "boolean" },
      price: { type: "double" },
      average_rating: { type: "double" },
      createdAt: { type: "date" },
    },
  },
};

export const mapFoodToSearchDocument = (food) => {
  const formattedFood = food.getFormattedData?.() || food;
  const createdAt = formattedFood.createdAt || food.createdAt || null;

  return {
    id: formattedFood.id?.toString(),
    name: formattedFood.name,
    category: formattedFood.categoryName || formattedFood.categoryId?.toString() || null,
    shop: formattedFood.shopName || formattedFood.shopId?.toString() || null,
    UrlImg: formattedFood.listUrlImg?.[0] || null,
    isAvailble: formattedFood.isAvailble,
    price: formattedFood.price,
    average_rating: formattedFood.average_rating,
    createdAt,
  };
};

const buildFoodSearchSort = (order = "relevant") => {
  switch (order) {
    case "price_low":
    case "price_asc":
      return [
        { price: { order: "asc", missing: "_last" } },
        { createdAt: { order: "desc", missing: "_last" } },
      ];
    case "price_high":
    case "price_desc":
      return [
        { price: { order: "desc", missing: "_last" } },
        { createdAt: { order: "desc", missing: "_last" } },
      ];
    case "rating_asc":
      return [
        { average_rating: { order: "asc", missing: "_last" } },
        { createdAt: { order: "desc", missing: "_last" } },
      ];
    case "rating_desc":
    case "rating":
      return [
        { average_rating: { order: "desc", missing: "_last" } },
        { createdAt: { order: "desc", missing: "_last" } },
      ];
    case "created_asc":
    case "oldest":
      return [{ createdAt: { order: "asc", missing: "_last" } }];
    case "created_desc":
    case "newest":
    case "recent":
      return [{ createdAt: { order: "desc", missing: "_last" } }];
    case "relevant":
    default:
      return [
        { _score: { order: "desc" } },
        { createdAt: { order: "desc", missing: "_last" } },
      ];
  }
};

export const createFoodSearchIndex = async () => {
  try {
    return await elasticsearchRequest(`/${FOOD_INDEX}`, {
      method: "PUT",
      body: JSON.stringify(foodIndexMapping),
    });
  } catch (error) {
    if (
      error.type === "resource_already_exists_exception" ||
      error.message.includes("already exists")
    ) {
      return { acknowledged: true, alreadyExists: true };
    }

    throw error;
  }
};

export const indexFoodSearchDocument = async (food) => {
  const formattedFood = food.getFormattedData?.() || food;

  if (formattedFood.isDraft) {
    return deleteFoodSearchDocument(formattedFood.id);
  }

  const document = mapFoodToSearchDocument(food);

  return elasticsearchRequest(`/${FOOD_INDEX}/_doc/${document.id}`, {
    method: "PUT",
    body: JSON.stringify(document),
  });
};

export const deleteFoodSearchDocument = async (foodId) => {
  if (!foodId) {
    return;
  }

  try {
    await elasticsearchRequest(`/${FOOD_INDEX}/_doc/${foodId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error.message !== "document_missing_exception" && error.message !== "not_found") {
      throw error;
    }
  }
};

export const safeIndexFoodSearchDocument = async (food, logger) => {
  try {
    await createFoodSearchIndex();
    await indexFoodSearchDocument(food);
  } catch (error) {
    logger?.warn(`Elasticsearch: Failed to index food ${food?.id || food?._id}`, error);
  }
};

export const safeDeleteFoodSearchDocument = async (foodId, logger) => {
  try {
    await deleteFoodSearchDocument(foodId);
  } catch (error) {
    logger?.warn(`Elasticsearch: Failed to delete food ${foodId}`, error);
  }
};

export const syncFoodSearchIndex = async () => {
  await createFoodSearchIndex();

  const foods = await Food.find({ isDraft: false })
    .populate("category")
    .populate("shop");

  if (!foods.length) {
    return { indexed: 0 };
  }

  const body = foods
    .flatMap((food) => {
      const document = mapFoodToSearchDocument(food);

      return [
        JSON.stringify({ index: { _index: FOOD_INDEX, _id: document.id } }),
        JSON.stringify(document),
      ];
    })
    .join("\n");

  const result = await elasticsearchRequest("/_bulk", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-ndjson",
    },
    body: `${body}\n`,
  });

  return {
    indexed: foods.length,
    errors: result.errors,
  };
};


export const searchFoodDocuments = async ({
  search = "",
  page = 1,
  limit = 10,
  minRating = 0,
  minPrice = null,
  maxPrice = null,
  order = "relevant",
} = {}) => {
  const from = (page - 1) * limit;
  const normalizedSearch = search.trim();
  const searchTokens = normalizedSearch.split(/\s+/).filter(Boolean);
  const minimumShouldMatch = searchTokens.length > 2
    ? Math.min(3, searchTokens.length - 1)
    : 1;
  const tokenMatches = searchTokens.map((token) => ({
    match: {
      name: {
        query: token,
        fuzziness: 1,
        prefix_length: 0,
      },
    },
  }));

  const must = normalizedSearch
    ? [
        {
          bool: {
            should: [
              {
                match_phrase: {
                  name: {
                    query: normalizedSearch,
                    boost: 4,
                  },
                },
              },
              {
                match_phrase_prefix: {
                  name: {
                    query: normalizedSearch,
                    boost: 3,
                  },
                },
              },
              {
                match: {
                  name: {
                    query: normalizedSearch,
                    fuzziness: 1,
                    prefix_length: 0,
                    operator: "or",
                    boost: 2,
                  },
                },
              },
              ...tokenMatches,
            ],
            minimum_should_match: minimumShouldMatch,
          },
        },
      ]
    : [{ match_all: {} }];

  const filter = [{ term: { isAvailble: true } }];

  if (minRating > 0) {
    filter.push({ range: { average_rating: { gte: minRating } } });
  }

  if (minPrice != null || maxPrice != null) {
    const priceRange = {};

    if (minPrice != null && !Number.isNaN(minPrice)) {
      priceRange.gte = minPrice;
    }

    if (maxPrice != null && !Number.isNaN(maxPrice)) {
      priceRange.lte = maxPrice;
    }

    if (Object.keys(priceRange).length > 0) {
      filter.push({ range: { price: priceRange } });
    }
  }

  const result = await elasticsearchRequest(`/${FOOD_INDEX}/_search`, {
    method: "POST",
    body: JSON.stringify({
      from,
      size: limit,
      query: {
        bool: {
          must,
          filter,
        },
      },
      sort: buildFoodSearchSort(order),
    }),
  });

  return {
    foods: result.hits.hits.map((hit) => hit._source),
    pagination: {
      page,
      limit,
      total: result.hits.total?.value || 0,
      pages: Math.ceil((result.hits.total?.value || 0) / limit),
    },
  };
};
