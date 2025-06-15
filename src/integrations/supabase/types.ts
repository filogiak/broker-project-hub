export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brokerages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokerages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_rules: {
        Row: {
          condition_operator: Database["public"]["Enums"]["condition_operator"]
          condition_value: string
          created_at: string
          id: string
          is_iterative: boolean | null
          source_item_id: string
          target_item_id: string
          updated_at: string
        }
        Insert: {
          condition_operator: Database["public"]["Enums"]["condition_operator"]
          condition_value: string
          created_at?: string
          id?: string
          is_iterative?: boolean | null
          source_item_id: string
          target_item_id: string
          updated_at?: string
        }
        Update: {
          condition_operator?: Database["public"]["Enums"]["condition_operator"]
          condition_value?: string
          created_at?: string
          id?: string
          is_iterative?: boolean | null
          source_item_id?: string
          target_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_rules_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_rules_target_item_id_fkey"
            columns: ["target_item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
        ]
      }
      form_generation_rules: {
        Row: {
          condition_logic: Json
          created_at: string
          id: string
          is_active: boolean
          priority: number
          rule_name: string
          rule_type: string
          target_criteria: Json
          updated_at: string
        }
        Insert: {
          condition_logic?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          rule_name: string
          rule_type: string
          target_criteria?: Json
          updated_at?: string
        }
        Update: {
          condition_logic?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          rule_name?: string
          rule_type?: string
          target_criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          brokerage_id: string | null
          created_at: string | null
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          encrypted_token: string | null
          expires_at: string
          id: string
          invited_by: string
          project_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          used_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          brokerage_id?: string | null
          created_at?: string | null
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          encrypted_token?: string | null
          expires_at?: string
          id?: string
          invited_by: string
          project_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          used_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          brokerage_id?: string | null
          created_at?: string | null
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          encrypted_token?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          project_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      item_options: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          item_id: string
          option_label: string
          option_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          item_id: string
          option_label: string
          option_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          item_id?: string
          option_label?: string
          option_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_options_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
        ]
      }
      items_categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brokerage_id: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          brokerage_id?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          brokerage_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_checklist_items: {
        Row: {
          boolean_value: boolean | null
          created_at: string
          date_value: string | null
          document_reference_id: string | null
          id: string
          item_id: string
          json_value: Json | null
          numeric_value: number | null
          participant_designation:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id: string
          status: Database["public"]["Enums"]["checklist_status"] | null
          text_value: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          boolean_value?: boolean | null
          created_at?: string
          date_value?: string | null
          document_reference_id?: string | null
          id?: string
          item_id: string
          json_value?: Json | null
          numeric_value?: number | null
          participant_designation?:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id: string
          status?: Database["public"]["Enums"]["checklist_status"] | null
          text_value?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          boolean_value?: boolean | null
          created_at?: string
          date_value?: string | null
          document_reference_id?: string | null
          id?: string
          item_id?: string
          json_value?: Json | null
          numeric_value?: number | null
          participant_designation?:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id?: string
          status?: Database["public"]["Enums"]["checklist_status"] | null
          text_value?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_checklist_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_debts: {
        Row: {
          account_number: string | null
          created_at: string
          creditor_name: string | null
          current_balance: number | null
          debt_type: string
          group_index: number
          id: string
          is_paid_off: boolean | null
          monthly_payment: number | null
          participant_designation: Database["public"]["Enums"]["participant_designation"]
          project_id: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          creditor_name?: string | null
          current_balance?: number | null
          debt_type: string
          group_index?: number
          id?: string
          is_paid_off?: boolean | null
          monthly_payment?: number | null
          participant_designation?: Database["public"]["Enums"]["participant_designation"]
          project_id: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          created_at?: string
          creditor_name?: string | null
          current_balance?: number | null
          debt_type?: string
          group_index?: number
          id?: string
          is_paid_off?: boolean | null
          monthly_payment?: number | null
          participant_designation?: Database["public"]["Enums"]["participant_designation"]
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_debts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_dependents: {
        Row: {
          created_at: string
          date_of_birth: string | null
          dependent_name: string
          dependent_on_taxes: boolean | null
          group_index: number
          id: string
          participant_designation: Database["public"]["Enums"]["participant_designation"]
          project_id: string
          relationship: string | null
          social_security_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          dependent_name: string
          dependent_on_taxes?: boolean | null
          group_index?: number
          id?: string
          participant_designation?: Database["public"]["Enums"]["participant_designation"]
          project_id: string
          relationship?: string | null
          social_security_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          dependent_name?: string
          dependent_on_taxes?: boolean | null
          group_index?: number
          id?: string
          participant_designation?: Database["public"]["Enums"]["participant_designation"]
          project_id?: string
          relationship?: string | null
          social_security_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_dependents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          item_id: string | null
          mime_type: string | null
          participant_designation:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id: string
          status: Database["public"]["Enums"]["checklist_status"] | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          item_id?: string | null
          mime_type?: string | null
          participant_designation?:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id: string
          status?: Database["public"]["Enums"]["checklist_status"] | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          item_id?: string | null
          mime_type?: string | null
          participant_designation?:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id?: string
          status?: Database["public"]["Enums"]["checklist_status"] | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string
          joined_at: string | null
          participant_designation:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          invited_by: string
          joined_at?: string | null
          participant_designation?:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          invited_by?: string
          joined_at?: string | null
          participant_designation?:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          project_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_properties: {
        Row: {
          created_at: string
          current_value: number | null
          group_index: number
          id: string
          is_primary_residence: boolean | null
          monthly_payment: number | null
          outstanding_mortgage: number | null
          participant_designation: Database["public"]["Enums"]["participant_designation"]
          project_id: string
          property_address: string
          property_type: string | null
          rental_income: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          group_index?: number
          id?: string
          is_primary_residence?: boolean | null
          monthly_payment?: number | null
          outstanding_mortgage?: number | null
          participant_designation: Database["public"]["Enums"]["participant_designation"]
          project_id: string
          property_address: string
          property_type?: string | null
          rental_income?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          group_index?: number
          id?: string
          is_primary_residence?: boolean | null
          monthly_payment?: number | null
          outstanding_mortgage?: number | null
          participant_designation?: Database["public"]["Enums"]["participant_designation"]
          project_id?: string
          property_address?: string
          property_type?: string | null
          rental_income?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_secondary_incomes: {
        Row: {
          created_at: string
          documentation_provided: boolean | null
          employer_name: string | null
          end_date: string | null
          group_index: number
          id: string
          income_type: string | null
          is_current: boolean | null
          monthly_amount: number | null
          participant_designation: Database["public"]["Enums"]["participant_designation"]
          project_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          documentation_provided?: boolean | null
          employer_name?: string | null
          end_date?: string | null
          group_index?: number
          id?: string
          income_type?: string | null
          is_current?: boolean | null
          monthly_amount?: number | null
          participant_designation?: Database["public"]["Enums"]["participant_designation"]
          project_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          documentation_provided?: boolean | null
          employer_name?: string | null
          end_date?: string | null
          group_index?: number
          id?: string
          income_type?: string | null
          is_current?: boolean | null
          monthly_amount?: number | null
          participant_designation?: Database["public"]["Enums"]["participant_designation"]
          project_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_secondary_incomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          applicant_count: Database["public"]["Enums"]["applicant_count"] | null
          brokerage_id: string
          checklist_generated_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          has_guarantor: boolean | null
          id: string
          name: string
          project_type: Database["public"]["Enums"]["project_type"] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_count?:
            | Database["public"]["Enums"]["applicant_count"]
            | null
          brokerage_id: string
          checklist_generated_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          has_guarantor?: boolean | null
          id?: string
          name: string
          project_type?: Database["public"]["Enums"]["project_type"] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_count?:
            | Database["public"]["Enums"]["applicant_count"]
            | null
          brokerage_id?: string
          checklist_generated_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          has_guarantor?: boolean | null
          id?: string
          name?: string
          project_type?: Database["public"]["Enums"]["project_type"] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      required_items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          item_name: string
          item_type: Database["public"]["Enums"]["item_type"]
          priority: number | null
          project_types_applicable:
            | Database["public"]["Enums"]["project_type"][]
            | null
          scope: Database["public"]["Enums"]["item_scope"]
          subcategory: string | null
          subcategory_2: string | null
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          item_name: string
          item_type?: Database["public"]["Enums"]["item_type"]
          priority?: number | null
          project_types_applicable?:
            | Database["public"]["Enums"]["project_type"][]
            | null
          scope?: Database["public"]["Enums"]["item_scope"]
          subcategory?: string | null
          subcategory_2?: string | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          item_name?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          priority?: number | null
          project_types_applicable?:
            | Database["public"]["Enums"]["project_type"][]
            | null
          scope?: Database["public"]["Enums"]["item_scope"]
          subcategory?: string | null
          subcategory_2?: string | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "required_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "items_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_project_safe: {
        Args: {
          project_name: string
          brokerage_uuid: string
          project_description?: string
        }
        Returns: string
      }
      generate_encrypted_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_project_checklist_items: {
        Args: { p_project_id: string }
        Returns: number
      }
      get_all_brokerage_owners: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          created_at: string
          updated_at: string
          brokerage_id: string
          owns_brokerage: boolean
          brokerage_name: string
        }[]
      }
      get_available_brokerage_owners: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
        }[]
      }
      get_brokerage_users: {
        Args: { brokerage_uuid: string }
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          roles: Database["public"]["Enums"]["user_role"][]
        }[]
      }
      get_user_roles: {
        Args: { user_uuid?: string }
        Returns: Database["public"]["Enums"]["user_role"][]
      }
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["user_role"]
          user_uuid?: string
        }
        Returns: boolean
      }
      is_superadmin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      safe_create_project: {
        Args:
          | { p_name: string; p_brokerage_id: string; p_description?: string }
          | {
              p_name: string
              p_brokerage_id: string
              p_description?: string
              p_project_type?: Database["public"]["Enums"]["project_type"]
              p_applicant_count?: Database["public"]["Enums"]["applicant_count"]
              p_has_guarantor?: boolean
            }
        Returns: string
      }
      user_can_access_project: {
        Args: { project_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_can_view_project_members: {
        Args: { project_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_is_project_member: {
        Args: { project_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_is_superadmin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      user_owns_brokerage: {
        Args: { brokerage_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_owns_project_brokerage: {
        Args: { project_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_owns_project_brokerage_simple: {
        Args: { project_uuid: string; user_uuid?: string }
        Returns: boolean
      }
    }
    Enums: {
      applicant_count:
        | "one_applicant"
        | "two_applicants"
        | "three_or_more_applicants"
      checklist_status: "pending" | "submitted" | "approved" | "rejected"
      condition_operator:
        | "EQUALS"
        | "NOT_EQUALS"
        | "GREATER_THAN"
        | "LESS_THAN"
        | "CONTAINS"
      item_scope: "PROJECT" | "PARTICIPANT"
      item_type:
        | "text"
        | "number"
        | "date"
        | "document"
        | "repeatable_group"
        | "single_choice_dropdown"
        | "multiple_choice_checkbox"
      participant_designation:
        | "solo_applicant"
        | "applicant_one"
        | "applicant_two"
      project_type:
        | "first_home_purchase"
        | "refinance"
        | "investment_property"
        | "construction_loan"
        | "home_equity_loan"
        | "reverse_mortgage"
      user_role:
        | "superadmin"
        | "brokerage_owner"
        | "broker_assistant"
        | "mortgage_applicant"
        | "real_estate_agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      applicant_count: [
        "one_applicant",
        "two_applicants",
        "three_or_more_applicants",
      ],
      checklist_status: ["pending", "submitted", "approved", "rejected"],
      condition_operator: [
        "EQUALS",
        "NOT_EQUALS",
        "GREATER_THAN",
        "LESS_THAN",
        "CONTAINS",
      ],
      item_scope: ["PROJECT", "PARTICIPANT"],
      item_type: [
        "text",
        "number",
        "date",
        "document",
        "repeatable_group",
        "single_choice_dropdown",
        "multiple_choice_checkbox",
      ],
      participant_designation: [
        "solo_applicant",
        "applicant_one",
        "applicant_two",
      ],
      project_type: [
        "first_home_purchase",
        "refinance",
        "investment_property",
        "construction_loan",
        "home_equity_loan",
        "reverse_mortgage",
      ],
      user_role: [
        "superadmin",
        "brokerage_owner",
        "broker_assistant",
        "mortgage_applicant",
        "real_estate_agent",
      ],
    },
  },
} as const
