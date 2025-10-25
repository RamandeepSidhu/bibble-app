/**
 * Smart Order Utilities
 * Handles sequential ordering for stories, chapters, and verses
 */

/**
 * Get the next available order number
 * Finds the first gap in the sequence or returns the next number
 * 
 * @param existingOrders - Array of existing order numbers
 * @returns Next available order number
 * 
 * Examples:
 * - [1, 2, 3] → 4
 * - [1, 3, 4] → 2 (fills gap)
 * - [2, 3, 4] → 1 (fills gap at start)
 * - [] → 1
 */
export const getNextOrder = (existingOrders: number[]): number => {
  if (existingOrders.length === 0) return 1;
  
  // Sort orders to find gaps
  const sortedOrders = [...existingOrders].sort((a, b) => a - b);
  
  // Find first gap starting from 1
  for (let i = 1; i <= sortedOrders.length + 1; i++) {
    if (!sortedOrders.includes(i)) {
      return i;
    }
  }
  
  // If no gaps, return next number
  return Math.max(...sortedOrders) + 1;
};

/**
 * Get next story order for a product
 */
export const getNextStoryOrder = async (productId: string, client: any): Promise<number> => {
  try {
    const response = await client.APP.getStoriesByProduct(productId);
    if (response?.success && response?.data) {
      const orders = response.data.map((story: any) => story.order || 0).filter((order: number) => order > 0);
      return getNextOrder(orders);
    }
    return 1;
  } catch (error) {
    console.error("Error calculating next story order:", error);
    return 1;
  }
};

/**
 * Get next chapter order for a story
 */
export const getNextChapterOrder = async (storyId: string, client: any): Promise<number> => {
  try {
    const response = await client.APP.getChaptersByStory(storyId);
    if (response?.success && response?.data) {
      const orders = response.data.map((chapter: any) => chapter.order || 0).filter((order: number) => order > 0);
      return getNextOrder(orders);
    }
    return 1;
  } catch (error) {
    console.error("Error calculating next chapter order:", error);
    return 1;
  }
};

/**
 * Get next verse number for a chapter
 */
export const getNextVerseNumber = async (chapterId: string, client: any): Promise<number> => {
  try {
    const response = await client.APP.getVersesByChapter(chapterId);
    if (response?.success && response?.data) {
      const numbers = response.data.map((verse: any) => verse.number || 0).filter((number: number) => number > 0);
      return getNextOrder(numbers);
    }
    return 1;
  } catch (error) {
    console.error("Error calculating next verse number:", error);
    return 1;
  }
};
