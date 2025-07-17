export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      brokerage_members: {
        Row: {
          brokerage_id: string
          id: string
          invited_at: string
          invited_by: string
          joined_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          brokerage_id: string
          id?: string
          invited_at?: string
          invited_by: string
          joined_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          brokerage_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokerage_members_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
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
      form_links: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          form_slug: string
          form_type: string | null
          id: string
          link: string
          participant_designation:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          simulation_id: string | null
          token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at: string
          form_slug: string
          form_type?: string | null
          id?: string
          link: string
          participant_designation?:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          simulation_id?: string | null
          token: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          form_slug?: string
          form_type?: string | null
          id?: string
          link?: string
          participant_designation?:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          simulation_id?: string | null
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_links_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          simulation_id: string | null
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
          simulation_id?: string | null
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
          simulation_id?: string | null
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
          {
            foreignKeyName: "invitations_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
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
      project_debt_items: {
        Row: {
          boolean_value: boolean | null
          created_at: string
          date_value: string | null
          document_reference_id: string | null
          group_index: number
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
          group_index?: number
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
          group_index?: number
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
            foreignKeyName: "project_debt_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_debt_items_project_id_fkey"
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
      project_secondary_income_items: {
        Row: {
          boolean_value: boolean | null
          created_at: string
          date_value: string | null
          document_reference_id: string | null
          group_index: number
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
          group_index?: number
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
          group_index?: number
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
            foreignKeyName: "project_secondary_income_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_secondary_income_items_project_id_fkey"
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
          applicant_one_first_name: string | null
          applicant_one_last_name: string | null
          applicant_two_first_name: string | null
          applicant_two_last_name: string | null
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
          applicant_one_first_name?: string | null
          applicant_one_last_name?: string | null
          applicant_two_first_name?: string | null
          applicant_two_last_name?: string | null
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
          applicant_one_first_name?: string | null
          applicant_one_last_name?: string | null
          applicant_two_first_name?: string | null
          applicant_two_last_name?: string | null
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
      question_logic_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          target_category_id: string | null
          target_subcategory: string
          trigger_item_id: string
          trigger_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          target_category_id?: string | null
          target_subcategory: string
          trigger_item_id: string
          trigger_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          target_category_id?: string | null
          target_subcategory?: string
          trigger_item_id?: string
          trigger_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_question_logic_rules_target_category"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "items_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_question_logic_rules_trigger_item"
            columns: ["trigger_item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_logic_rules_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "items_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_logic_rules_trigger_item_id_fkey"
            columns: ["trigger_item_id"]
            isOneToOne: false
            referencedRelation: "required_items"
            referencedColumns: ["id"]
          },
        ]
      }
      required_items: {
        Row: {
          answer_id: string | null
          category_id: string | null
          created_at: string
          id: string
          is_multi_flow_initiator: boolean | null
          item_name: string
          item_type: Database["public"]["Enums"]["item_type"]
          priority: number | null
          project_types_applicable:
            | Database["public"]["Enums"]["project_type"][]
            | null
          repeatable_group_start_button_text: string | null
          repeatable_group_subtitle: string | null
          repeatable_group_target_table:
            | Database["public"]["Enums"]["repeatable_group_target_table"]
            | null
          repeatable_group_title: string | null
          repeatable_group_top_button_text: string | null
          scope: Database["public"]["Enums"]["item_scope"]
          subcategory: string | null
          subcategory_1_initiator: boolean | null
          subcategory_2: string | null
          subcategory_2_initiator: boolean | null
          subcategory_3: string | null
          subcategory_3_initiator: boolean | null
          subcategory_4: string | null
          subcategory_4_initiator: boolean | null
          subcategory_5: string | null
          subcategory_5_initiator: boolean | null
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          answer_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_multi_flow_initiator?: boolean | null
          item_name: string
          item_type?: Database["public"]["Enums"]["item_type"]
          priority?: number | null
          project_types_applicable?:
            | Database["public"]["Enums"]["project_type"][]
            | null
          repeatable_group_start_button_text?: string | null
          repeatable_group_subtitle?: string | null
          repeatable_group_target_table?:
            | Database["public"]["Enums"]["repeatable_group_target_table"]
            | null
          repeatable_group_title?: string | null
          repeatable_group_top_button_text?: string | null
          scope?: Database["public"]["Enums"]["item_scope"]
          subcategory?: string | null
          subcategory_1_initiator?: boolean | null
          subcategory_2?: string | null
          subcategory_2_initiator?: boolean | null
          subcategory_3?: string | null
          subcategory_3_initiator?: boolean | null
          subcategory_4?: string | null
          subcategory_4_initiator?: boolean | null
          subcategory_5?: string | null
          subcategory_5_initiator?: boolean | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          answer_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_multi_flow_initiator?: boolean | null
          item_name?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          priority?: number | null
          project_types_applicable?:
            | Database["public"]["Enums"]["project_type"][]
            | null
          repeatable_group_start_button_text?: string | null
          repeatable_group_subtitle?: string | null
          repeatable_group_target_table?:
            | Database["public"]["Enums"]["repeatable_group_target_table"]
            | null
          repeatable_group_title?: string | null
          repeatable_group_top_button_text?: string | null
          scope?: Database["public"]["Enums"]["item_scope"]
          subcategory?: string | null
          subcategory_1_initiator?: boolean | null
          subcategory_2?: string | null
          subcategory_2_initiator?: boolean | null
          subcategory_3?: string | null
          subcategory_3_initiator?: boolean | null
          subcategory_4?: string | null
          subcategory_4_initiator?: boolean | null
          subcategory_5?: string | null
          subcategory_5_initiator?: boolean | null
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
      simulation_members: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string
          joined_at: string | null
          participant_designation:
            | Database["public"]["Enums"]["participant_designation"]
            | null
          role: Database["public"]["Enums"]["user_role"]
          simulation_id: string
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
          role: Database["public"]["Enums"]["user_role"]
          simulation_id: string
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
          role?: Database["public"]["Enums"]["user_role"]
          simulation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_members_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_participants: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          participant_designation: Database["public"]["Enums"]["participant_designation"]
          phone: string | null
          simulation_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          participant_designation: Database["public"]["Enums"]["participant_designation"]
          phone?: string | null
          simulation_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          participant_designation?: Database["public"]["Enums"]["participant_designation"]
          phone?: string | null
          simulation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_participants_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          applicant_count: Database["public"]["Enums"]["applicant_count"] | null
          brokerage_id: string
          converted_at: string | null
          converted_to_project_id: string | null
          created_at: string
          created_by: string
          description: string | null
          forms_generated_at: string | null
          id: string
          name: string
          project_contact_email: string | null
          project_contact_name: string | null
          project_contact_phone: string | null
          setup_completed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_count?:
            | Database["public"]["Enums"]["applicant_count"]
            | null
          brokerage_id: string
          converted_at?: string | null
          converted_to_project_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          forms_generated_at?: string | null
          id?: string
          name: string
          project_contact_email?: string | null
          project_contact_name?: string | null
          project_contact_phone?: string | null
          setup_completed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_count?:
            | Database["public"]["Enums"]["applicant_count"]
            | null
          brokerage_id?: string
          converted_at?: string | null
          converted_to_project_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          forms_generated_at?: string | null
          id?: string
          name?: string
          project_contact_email?: string | null
          project_contact_name?: string | null
          project_contact_phone?: string | null
          setup_completed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
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
      webhook_logs: {
        Row: {
          created_at: string
          details: Json
          event_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: Json
          event_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: Json
          event_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation_by_id: {
        Args: { p_invitation_id: string; p_user_id?: string }
        Returns: Json
      }
      check_invitation_status: {
        Args: { p_email: string }
        Returns: Json
      }
      cleanup_orphaned_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_email: string
          removed_roles: Database["public"]["Enums"]["user_role"][]
          kept_roles: Database["public"]["Enums"]["user_role"][]
        }[]
      }
      create_brokerage_invitation: {
        Args: {
          p_brokerage_id: string
          p_email: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_invited_by?: string
        }
        Returns: Json
      }
      create_project_safe: {
        Args: {
          project_name: string
          brokerage_uuid: string
          project_description?: string
        }
        Returns: string
      }
      create_simulation_invitation: {
        Args: {
          p_simulation_id: string
          p_email: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_invited_by?: string
        }
        Returns: Json
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
      get_brokerage_by_access: {
        Args: { user_uuid?: string }
        Returns: {
          id: string
          name: string
          description: string
          owner_id: string
          created_at: string
          updated_at: string
          access_type: string
        }[]
      }
      get_brokerage_outgoing_invitations: {
        Args: { p_brokerage_id: string }
        Returns: {
          id: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
          created_at: string
          expires_at: string
          accepted_at: string
          email_sent: boolean
          email_sent_at: string
          inviter_name: string
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
      get_categories_completion_batch: {
        Args: {
          p_project_id: string
          p_category_ids: string[]
          p_participant_designation?: Database["public"]["Enums"]["participant_designation"]
        }
        Returns: {
          category_id: string
          total_items: number
          completed_items: number
        }[]
      }
      get_my_pending_invitations: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      get_user_brokerage_roles: {
        Args: { brokerage_uuid: string; user_uuid?: string }
        Returns: Database["public"]["Enums"]["user_role"][]
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
      is_user_superadmin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      process_invitation_acceptance: {
        Args: { p_email: string; p_encrypted_token: string; p_user_id?: string }
        Returns: Json
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
          | {
              p_name: string
              p_brokerage_id: string
              p_description?: string
              p_project_type?: Database["public"]["Enums"]["project_type"]
              p_applicant_count?: Database["public"]["Enums"]["applicant_count"]
              p_has_guarantor?: boolean
              p_applicant_one_first_name?: string
              p_applicant_one_last_name?: string
              p_applicant_two_first_name?: string
              p_applicant_two_last_name?: string
            }
        Returns: string
      }
      safe_create_simulation: {
        Args: { p_name: string; p_brokerage_id: string; p_description?: string }
        Returns: string
      }
      safe_delete_simulation: {
        Args: { p_simulation_id: string }
        Returns: Json
      }
      test_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      user_can_access_brokerage: {
        Args: { brokerage_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_can_access_project: {
        Args: { project_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_can_view_project_members: {
        Args: { project_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_created_simulation: {
        Args: { simulation_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_is_broker_assistant_for_brokerage: {
        Args: { brokerage_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_is_brokerage_member: {
        Args: { brokerage_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_is_project_member: {
        Args: { project_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_is_simulation_member: {
        Args: { simulation_uuid: string; user_uuid?: string }
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
      user_owns_simulation_brokerage: {
        Args: { simulation_uuid: string; user_uuid?: string }
        Returns: boolean
      }
    }
    Enums: {
      applicant_count:
        | "one_applicant"
        | "two_applicants"
        | "three_or_more_applicants"
      checklist_status: "pending" | "submitted" | "approved" | "rejected"
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
      repeatable_group_target_table:
        | "project_secondary_income_items"
        | "project_dependent_items"
        | "project_debt_items"
      user_role:
        | "superadmin"
        | "brokerage_owner"
        | "broker_assistant"
        | "mortgage_applicant"
        | "real_estate_agent"
        | "simulation_collaborator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
      repeatable_group_target_table: [
        "project_secondary_income_items",
        "project_dependent_items",
        "project_debt_items",
      ],
      user_role: [
        "superadmin",
        "brokerage_owner",
        "broker_assistant",
        "mortgage_applicant",
        "real_estate_agent",
        "simulation_collaborator",
      ],
    },
  },
} as const
