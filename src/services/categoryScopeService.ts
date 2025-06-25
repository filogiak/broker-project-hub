
import { supabase } from '@/integrations/supabase/client';

export interface CategoryScopeInfo {
  hasParticipantScopedQuestions: boolean;
  hasProjectScopedQuestions: boolean;
  totalQuestions: number;
}

export class CategoryScopeService {
  private static scopeCache = new Map<string, CategoryScopeInfo>();

  /**
   * Check if a category has any questions that require participant designation
   */
  static async checkCategoryRequiresParticipantSelection(
    categoryId: string,
    projectId?: string
  ): Promise<boolean> {
    try {
      const cacheKey = `${categoryId}-${projectId || 'global'}`;
      
      if (this.scopeCache.has(cacheKey)) {
        const cached = this.scopeCache.get(cacheKey)!;
        return cached.hasParticipantScopedQuestions;
      }

      const scopeInfo = await this.getCategoryScopeInfo(categoryId, projectId);
      this.scopeCache.set(cacheKey, scopeInfo);
      
      return scopeInfo.hasParticipantScopedQuestions;
    } catch (error) {
      console.error('Error checking category scope:', error);
      // Fallback to showing applicant selection if we can't determine scope (safer default)
      return true;
    }
  }

  /**
   * Get detailed scope information for a category
   */
  static async getCategoryScopeInfo(
    categoryId: string,
    projectId?: string
  ): Promise<CategoryScopeInfo> {
    console.log('🔍 Checking scope for category:', categoryId, 'project:', projectId);

    const { data: requiredItems, error } = await supabase
      .from('required_items')
      .select('scope, item_type, project_types_applicable')
      .eq('category_id', categoryId);

    if (error) {
      throw error;
    }

    if (!requiredItems || requiredItems.length === 0) {
      console.log('📝 No required items found for category');
      return {
        hasParticipantScopedQuestions: false,
        hasProjectScopedQuestions: false,
        totalQuestions: 0
      };
    }

    // Filter items that are applicable to the project (if project info is available)
    let applicableItems = requiredItems;
    
    // For now, we'll check scope regardless of project type filtering
    // This can be enhanced later if needed
    
    const hasParticipantScoped = applicableItems.some(item => item.scope === 'PARTICIPANT');
    const hasProjectScoped = applicableItems.some(item => item.scope === 'PROJECT');

    const scopeInfo = {
      hasParticipantScopedQuestions: hasParticipantScoped,
      hasProjectScopedQuestions: hasProjectScoped,
      totalQuestions: applicableItems.length
    };

    console.log('📊 Category scope info:', {
      categoryId,
      ...scopeInfo
    });

    return scopeInfo;
  }

  /**
   * Preload scope information for multiple categories
   */
  static async preloadCategoryScopes(
    categoryIds: string[],
    projectId?: string
  ): Promise<Map<string, CategoryScopeInfo>> {
    const results = new Map<string, CategoryScopeInfo>();
    
    try {
      const promises = categoryIds.map(async (categoryId) => {
        const scopeInfo = await this.getCategoryScopeInfo(categoryId, projectId);
        const cacheKey = `${categoryId}-${projectId || 'global'}`;
        this.scopeCache.set(cacheKey, scopeInfo);
        results.set(categoryId, scopeInfo);
        return { categoryId, scopeInfo };
      });

      await Promise.all(promises);
      console.log('📚 Preloaded scopes for', categoryIds.length, 'categories');
    } catch (error) {
      console.error('Error preloading category scopes:', error);
    }

    return results;
  }

  /**
   * Clear the scope cache (useful for testing or data refresh)
   */
  static clearCache(): void {
    this.scopeCache.clear();
    console.log('🗑️ Category scope cache cleared');
  }
}
