/**
 * Response handler utility functions
 */

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const errorResponse = (res, error, message = 'Error', statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
    timestamp: new Date().toISOString(),
  });
};

export const paginatedResponse = (res, data, page, limit, total, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  });
};
