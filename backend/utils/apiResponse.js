/**
 * Standardized API response helper.
 * Provides consistent JSON response structures across all endpoints.
 */
class ApiResponse {
  /**
   * Send a success response.
   * @param {import('express').Response} res - Express response object
   * @param {*} data - Response payload
   * @param {string} [message='Success'] - Human-readable message
   * @param {number} [statusCode=200] - HTTP status code
   */
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send an error response.
   * @param {import('express').Response} res - Express response object
   * @param {string} [message='Server Error'] - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Array|null} [errors=null] - Optional array of detailed errors
   */
  static error(res, message = 'Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated success response.
   * @param {import('express').Response} res - Express response object
   * @param {Array} data - Array of items for the current page
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items across all pages
   */
  static paginated(res, data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Success',
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  }
}

module.exports = ApiResponse;
