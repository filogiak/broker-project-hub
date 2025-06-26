
import { 
  Home, 
  User, 
  Briefcase, 
  DollarSign, 
  Database, 
  File,
  type LucideIcon 
} from 'lucide-react';

export interface CategoryIconMapping {
  [key: string]: LucideIcon;
}

export class CategoryIconService {
  private static iconMap: CategoryIconMapping = {
    // Default mappings - can be expanded based on category names
    'property': Home,
    'personal': User,
    'employment': Briefcase,
    'financial': DollarSign,
    'income': DollarSign,
    'business': Briefcase,
    'documents': File,
    'records': Database,
    'information': Database,
    'default': File
  };

  /**
   * Get icon for a category based on its name
   */
  static getIconForCategory(categoryName: string): LucideIcon {
    const lowercaseName = categoryName.toLowerCase();
    
    // Check for exact matches first
    if (this.iconMap[lowercaseName]) {
      return this.iconMap[lowercaseName];
    }

    // Check for partial matches
    for (const [key, icon] of Object.entries(this.iconMap)) {
      if (lowercaseName.includes(key) || key.includes(lowercaseName)) {
        return icon;
      }
    }

    // Return default icon
    return this.iconMap.default;
  }

  /**
   * Add custom icon mapping
   */
  static addIconMapping(categoryName: string, icon: LucideIcon): void {
    this.iconMap[categoryName.toLowerCase()] = icon;
  }
}
