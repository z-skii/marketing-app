export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          location_id: string | null
          note: string | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          location_id?: string | null
          note?: string | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          location_id?: string | null
          note?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          created_at: string
          id: string
          label: string
          organization_id: string
          requires_photo: boolean
          sort_order: number
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          organization_id: string
          requires_photo?: boolean
          sort_order?: number
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          organization_id?: string
          requires_photo?: boolean
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_submission_items: {
        Row: {
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          created_at: string
          id: string
          item_id: string
          note: string | null
          organization_id: string
          photo_path: string | null
          submission_id: string
        }
        Insert: {
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          item_id: string
          note?: string | null
          organization_id: string
          photo_path?: string | null
          submission_id: string
        }
        Update: {
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          item_id?: string
          note?: string | null
          organization_id?: string
          photo_path?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_submission_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_submission_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_submission_items_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "checklist_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_submissions: {
        Row: {
          business_date: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["checklist_kind"]
          location_id: string
          organization_id: string
          started_at: string
          status: Database["public"]["Enums"]["submission_status"]
          submitted_by: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          business_date: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["checklist_kind"]
          location_id: string
          organization_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          business_date?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["checklist_kind"]
          location_id?: string
          organization_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_submissions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_submissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["checklist_kind"]
          location_id: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["checklist_kind"]
          location_id?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["checklist_kind"]
          location_id?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      closeout_reports: {
        Row: {
          actual_cash: number | null
          attention: Json
          business_date: string
          card_sales: number
          cash_difference: number | null
          cash_sales: number
          closed_at: string
          closed_by: string | null
          comparisons: Json
          created_at: string
          daily_report_id: string
          expected_cash: number | null
          goods_total: number
          id: string
          labor_employee_count: number
          labor_minutes: number
          labor_total: number
          location_id: string
          margin: number | null
          organization_id: string
          other_sales: number
          other_total: number
          profit: number
          total_expenses: number
          total_sales: number
          utilities_total: number
        }
        Insert: {
          actual_cash?: number | null
          attention?: Json
          business_date: string
          card_sales?: number
          cash_difference?: number | null
          cash_sales?: number
          closed_at?: string
          closed_by?: string | null
          comparisons?: Json
          created_at?: string
          daily_report_id: string
          expected_cash?: number | null
          goods_total?: number
          id?: string
          labor_employee_count?: number
          labor_minutes?: number
          labor_total?: number
          location_id: string
          margin?: number | null
          organization_id: string
          other_sales?: number
          other_total?: number
          profit?: number
          total_expenses?: number
          total_sales?: number
          utilities_total?: number
        }
        Update: {
          actual_cash?: number | null
          attention?: Json
          business_date?: string
          card_sales?: number
          cash_difference?: number | null
          cash_sales?: number
          closed_at?: string
          closed_by?: string | null
          comparisons?: Json
          created_at?: string
          daily_report_id?: string
          expected_cash?: number | null
          goods_total?: number
          id?: string
          labor_employee_count?: number
          labor_minutes?: number
          labor_total?: number
          location_id?: string
          margin?: number | null
          organization_id?: string
          other_sales?: number
          other_total?: number
          profit?: number
          total_expenses?: number
          total_sales?: number
          utilities_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "closeout_reports_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_accounting"
            referencedColumns: ["daily_report_id"]
          },
          {
            foreignKeyName: "closeout_reports_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closeout_reports_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closeout_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          actual_cash: number | null
          business_date: string
          card_sales: number | null
          cash_goods: number | null
          cash_sales: number | null
          check_goods: number | null
          close_count: number
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          expected_cash: number | null
          id: string
          location_id: string
          notes: string | null
          organization_id: string
          other_expenses: number | null
          other_sales: number | null
          reopened_at: string | null
          reopened_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
          utilities: number | null
        }
        Insert: {
          actual_cash?: number | null
          business_date: string
          card_sales?: number | null
          cash_goods?: number | null
          cash_sales?: number | null
          check_goods?: number | null
          close_count?: number
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          expected_cash?: number | null
          id?: string
          location_id: string
          notes?: string | null
          organization_id: string
          other_expenses?: number | null
          other_sales?: number | null
          reopened_at?: string | null
          reopened_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          utilities?: number | null
        }
        Update: {
          actual_cash?: number | null
          business_date?: string
          card_sales?: number | null
          cash_goods?: number | null
          cash_sales?: number | null
          check_goods?: number | null
          close_count?: number
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          expected_cash?: number | null
          id?: string
          location_id?: string
          notes?: string | null
          organization_id?: string
          other_expenses?: number | null
          other_sales?: number | null
          reopened_at?: string | null
          reopened_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          utilities?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_locations: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          location_id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          location_id: string
          organization_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          location_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_locations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_pay_rates: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          employee_id: string
          hourly_rate: number
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          employee_id: string
          hourly_rate: number
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          employee_id?: string
          hourly_rate?: number
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_pay_rates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_pay_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          created_by: string | null
          default_location_id: string | null
          email: string | null
          employment_status: Database["public"]["Enums"]["employment_status"]
          end_date: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          organization_id: string
          phone: string | null
          role: Database["public"]["Enums"]["org_role"]
          start_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_location_id?: string | null
          email?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          end_date?: string | null
          first_name: string
          id?: string
          last_name?: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          start_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_location_id?: string | null
          email?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          end_date?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          start_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_default_location_id_fkey"
            columns: ["default_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          bucket: Database["public"]["Enums"]["accounting_bucket"]
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bucket?: Database["public"]["Enums"]["accounting_bucket"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bucket?: Database["public"]["Enums"]["accounting_bucket"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_date: string
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location_id: string
          organization_id: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_id: string | null
          recurring_expense_id: string | null
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          business_date: string
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location_id: string
          organization_id: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_id?: string | null
          recurring_expense_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          business_date?: string
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location_id?: string
          organization_id?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_id?: string | null
          recurring_expense_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recurring_expense_id_fkey"
            columns: ["recurring_expense_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string | null
          email: string
          employee_id: string | null
          expires_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_members: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_primary: boolean
          location_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          location_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          location_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_settings: {
        Row: {
          closes_at: string | null
          created_at: string
          location_id: string
          opens_at: string | null
          organization_id: string
          require_accounting_closeout: boolean
          require_cash_count: boolean
          require_closing_checklist: boolean
          require_employee_verification: boolean
          require_manager_approval: boolean
          require_opening_checklist: boolean
          starting_cash: number
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          location_id: string
          opens_at?: string | null
          organization_id: string
          require_accounting_closeout?: boolean
          require_cash_count?: boolean
          require_closing_checklist?: boolean
          require_employee_verification?: boolean
          require_manager_approval?: boolean
          require_opening_checklist?: boolean
          starting_cash?: number
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          location_id?: string
          opens_at?: string | null
          organization_id?: string
          require_accounting_closeout?: boolean
          require_cash_count?: boolean
          require_closing_checklist?: boolean
          require_employee_verification?: boolean
          require_manager_approval?: boolean
          require_opening_checklist?: boolean
          starting_cash?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          color: string | null
          country: string | null
          created_at: string
          created_by: string | null
          geofence_radius_m: number | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          sort_order: number
          state: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          color?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          geofence_radius_m?: number | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          sort_order?: number
          state?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          color?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          geofence_radius_m?: number | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          sort_order?: number
          state?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          prefs: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          prefs?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          prefs?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          location_id: string | null
          organization_id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          location_id?: string | null
          organization_id: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          location_id?: string | null
          organization_id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          permissions: Json
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          permissions?: Json
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          allow_clock_in_outside_radius: boolean
          allow_clock_in_without_photo: boolean
          cash_check_enabled: boolean
          created_at: string
          currency: string
          default_geofence_radius_m: number
          employee_can_view_accounting: boolean
          organization_id: string
          other_sales_enabled: boolean
          overtime_daily_hours: number | null
          overtime_enabled: boolean
          overtime_multiplier: number
          overtime_weekly_hours: number
          updated_at: string
          week_starts_on: number
        }
        Insert: {
          allow_clock_in_outside_radius?: boolean
          allow_clock_in_without_photo?: boolean
          cash_check_enabled?: boolean
          created_at?: string
          currency?: string
          default_geofence_radius_m?: number
          employee_can_view_accounting?: boolean
          organization_id: string
          other_sales_enabled?: boolean
          overtime_daily_hours?: number | null
          overtime_enabled?: boolean
          overtime_multiplier?: number
          overtime_weekly_hours?: number
          updated_at?: string
          week_starts_on?: number
        }
        Update: {
          allow_clock_in_outside_radius?: boolean
          allow_clock_in_without_photo?: boolean
          cash_check_enabled?: boolean
          created_at?: string
          currency?: string
          default_geofence_radius_m?: number
          employee_can_view_accounting?: boolean
          organization_id?: string
          other_sales_enabled?: boolean
          overtime_daily_hours?: number | null
          overtime_enabled?: boolean
          overtime_multiplier?: number
          overtime_weekly_hours?: number
          updated_at?: string
          week_starts_on?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_type: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          is_demo: boolean
          name: string
          onboarding_completed: boolean
          onboarding_step: number
          owner_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_demo?: boolean
          name: string
          onboarding_completed?: boolean
          onboarding_step?: number
          owner_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          business_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_demo?: boolean
          name?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          owner_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_organization_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active_organization_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active_organization_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_org_fk"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          bytes: number | null
          content_type: string | null
          created_at: string
          created_by: string | null
          id: string
          location_id: string | null
          ocr_amount: number | null
          ocr_category_suggestion: string | null
          ocr_date: string | null
          ocr_raw: Json | null
          ocr_status: string
          ocr_tax: number | null
          ocr_vendor: string | null
          organization_id: string
          original_filename: string | null
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          bytes?: number | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          ocr_amount?: number | null
          ocr_category_suggestion?: string | null
          ocr_date?: string | null
          ocr_raw?: Json | null
          ocr_status?: string
          ocr_tax?: number | null
          ocr_vendor?: string | null
          organization_id: string
          original_filename?: string | null
          storage_bucket?: string
          storage_path: string
        }
        Update: {
          bytes?: number | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          ocr_amount?: number | null
          ocr_category_suggestion?: string | null
          ocr_date?: string | null
          ocr_raw?: Json | null
          ocr_status?: string
          ocr_tax?: number | null
          ocr_vendor?: string | null
          organization_id?: string
          original_filename?: string | null
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          amount: number
          auto_mark_paid: boolean
          category_id: string
          created_at: string
          created_by: string | null
          day_of_month: number | null
          description: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          is_active: boolean
          location_id: string
          next_due_date: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          auto_mark_paid?: boolean
          category_id: string
          created_at?: string
          created_by?: string | null
          day_of_month?: number | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_active?: boolean
          location_id: string
          next_due_date: string
          organization_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          auto_mark_paid?: boolean
          category_id?: string
          created_at?: string
          created_by?: string | null
          day_of_month?: number | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_active?: boolean
          location_id?: string
          next_due_date?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          ends_at: string
          id: string
          location_id: string
          note: string | null
          organization_id: string
          series_id: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          ends_at: string
          id?: string
          location_id: string
          note?: string | null
          organization_id: string
          series_id?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          ends_at?: string
          id?: string
          location_id?: string
          note?: string | null
          organization_id?: string
          series_id?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_photos: {
        Row: {
          bytes: number | null
          content_hash: string | null
          content_type: string | null
          created_at: string
          created_by: string | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["verification_kind"]
          location_id: string | null
          organization_id: string
          shift_id: string | null
          storage_bucket: string
          storage_path: string
          taken_at: string
          width: number | null
        }
        Insert: {
          bytes?: number | null
          content_hash?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["verification_kind"]
          location_id?: string | null
          organization_id: string
          shift_id?: string | null
          storage_bucket?: string
          storage_path: string
          taken_at?: string
          width?: number | null
        }
        Update: {
          bytes?: number | null
          content_hash?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          location_id?: string | null
          organization_id?: string
          shift_id?: string | null
          storage_bucket?: string
          storage_path?: string
          taken_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_photos_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_photos_shift_fk"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_verifications: {
        Row: {
          accuracy_m: number | null
          created_at: string
          created_by: string | null
          device_info: Json
          distance_m: number | null
          flags: string[]
          id: string
          kind: Database["public"]["Enums"]["verification_kind"]
          latitude: number | null
          location_id: string
          longitude: number | null
          organization_id: string
          photo_id: string | null
          radius_m: number | null
          recorded_at: string
          shift_id: string
          status: Database["public"]["Enums"]["verification_status"]
          within_radius: boolean | null
        }
        Insert: {
          accuracy_m?: number | null
          created_at?: string
          created_by?: string | null
          device_info?: Json
          distance_m?: number | null
          flags?: string[]
          id?: string
          kind: Database["public"]["Enums"]["verification_kind"]
          latitude?: number | null
          location_id: string
          longitude?: number | null
          organization_id: string
          photo_id?: string | null
          radius_m?: number | null
          recorded_at?: string
          shift_id: string
          status?: Database["public"]["Enums"]["verification_status"]
          within_radius?: boolean | null
        }
        Update: {
          accuracy_m?: number | null
          created_at?: string
          created_by?: string | null
          device_info?: Json
          distance_m?: number | null
          flags?: string[]
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          latitude?: number | null
          location_id?: string
          longitude?: number | null
          organization_id?: string
          photo_id?: string | null
          radius_m?: number | null
          recorded_at?: string
          shift_id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          within_radius?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_verifications_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_verifications_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "shift_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_verifications_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number
          business_date: string
          clock_in_at: string
          clock_out_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          hourly_rate_snapshot: number | null
          id: string
          labor_cost: number | null
          location_id: string
          note: string | null
          organization_id: string
          source: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          worked_minutes: number | null
        }
        Insert: {
          break_minutes?: number
          business_date: string
          clock_in_at?: string
          clock_out_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          hourly_rate_snapshot?: number | null
          id?: string
          labor_cost?: number | null
          location_id: string
          note?: string | null
          organization_id: string
          source?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          worked_minutes?: number | null
        }
        Update: {
          break_minutes?: number
          business_date?: string
          clock_in_at?: string
          clock_out_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          hourly_rate_snapshot?: number | null
          id?: string
          labor_cost?: number | null
          location_id?: string
          note?: string | null
          organization_id?: string
          source?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          worked_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      time_adjustments: {
        Row: {
          adjusted_by: string
          created_at: string
          id: string
          location_id: string
          new_clock_in: string | null
          new_clock_out: string | null
          new_minutes: number | null
          organization_id: string
          original_clock_in: string | null
          original_clock_out: string | null
          original_minutes: number | null
          reason: string
          shift_id: string
        }
        Insert: {
          adjusted_by: string
          created_at?: string
          id?: string
          location_id: string
          new_clock_in?: string | null
          new_clock_out?: string | null
          new_minutes?: number | null
          organization_id: string
          original_clock_in?: string | null
          original_clock_out?: string | null
          original_minutes?: number | null
          reason: string
          shift_id: string
        }
        Update: {
          adjusted_by?: string
          created_at?: string
          id?: string
          location_id?: string
          new_clock_in?: string | null
          new_clock_out?: string | null
          new_minutes?: number | null
          organization_id?: string
          original_clock_in?: string | null
          original_clock_out?: string | null
          original_minutes?: number | null
          reason?: string
          shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_adjustments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_adjustments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_adjustments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_accounting: {
        Row: {
          actual_cash: number | null
          business_date: string | null
          card_sales: number | null
          cash_difference: number | null
          cash_goods: number | null
          cash_sales: number | null
          check_goods: number | null
          closed_at: string | null
          closed_by: string | null
          daily_report_id: string | null
          detailed_expense_count: number | null
          detailed_goods: number | null
          detailed_labor: number | null
          detailed_other: number | null
          detailed_utilities: number | null
          expected_cash: number | null
          goods_total: number | null
          labor_employee_count: number | null
          labor_minutes: number | null
          labor_total: number | null
          location_id: string | null
          margin_pct: number | null
          notes: string | null
          organization_id: string | null
          other_expenses: number | null
          other_sales: number | null
          other_total: number | null
          profit: number | null
          status: Database["public"]["Enums"]["report_status"] | null
          total_expenses: number | null
          total_sales: number | null
          utilities: number | null
          utilities_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      accounting_by_day: {
        Args: {
          p_from: string
          p_location_ids: string[] | null
          p_org: string
          p_to: string
        }
        Returns: {
          business_date: string
          card_sales: number
          cash_sales: number
          closed: number
          goods_total: number
          labor_total: number
          profit: number
          reports: number
          total_expenses: number
          total_sales: number
        }[]
      }
      accounting_by_location: {
        Args: { p_from: string; p_org: string; p_to: string }
        Returns: {
          card_sales: number
          cash_difference: number
          cash_sales: number
          days_closed: number
          days_with_data: number
          goods_total: number
          labor_minutes: number
          labor_total: number
          location_id: string
          margin_pct: number
          other_total: number
          profit: number
          total_expenses: number
          total_sales: number
          utilities_total: number
        }[]
      }
      accounting_totals: {
        Args: {
          p_from: string
          p_location_ids: string[] | null
          p_org: string
          p_to: string
        }
        Returns: {
          card_sales: number
          cash_difference: number
          cash_sales: number
          days_closed: number
          days_with_data: number
          goods_total: number
          labor_employee_count: number
          labor_minutes: number
          labor_total: number
          margin_pct: number
          other_sales: number
          other_total: number
          profit: number
          total_expenses: number
          total_sales: number
          utilities_total: number
        }[]
      }
      adjust_shift: {
        Args: {
          p_break_minutes?: number
          p_clock_in: string
          p_clock_out: string
          p_reason: string
          p_shift_id: string
        }
        Returns: {
          break_minutes: number
          business_date: string
          clock_in_at: string
          clock_out_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          hourly_rate_snapshot: number | null
          id: string
          labor_cost: number | null
          location_id: string
          note: string | null
          organization_id: string
          source: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          worked_minutes: number | null
        }
        SetofOptions: {
          from: "*"
          to: "shifts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      clock_in: {
        Args: {
          p_accuracy_m?: number
          p_device?: Json
          p_latitude?: number
          p_location_id: string
          p_longitude?: number
          p_photo_bytes?: number
          p_photo_hash?: string
          p_photo_path?: string
        }
        Returns: {
          break_minutes: number
          business_date: string
          clock_in_at: string
          clock_out_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          hourly_rate_snapshot: number | null
          id: string
          labor_cost: number | null
          location_id: string
          note: string | null
          organization_id: string
          source: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          worked_minutes: number | null
        }
        SetofOptions: {
          from: "*"
          to: "shifts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      clock_out: {
        Args: {
          p_accuracy_m?: number
          p_device?: Json
          p_latitude?: number
          p_longitude?: number
          p_photo_bytes?: number
          p_photo_hash?: string
          p_photo_path?: string
          p_shift_id: string
        }
        Returns: {
          break_minutes: number
          business_date: string
          clock_in_at: string
          clock_out_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          hourly_rate_snapshot: number | null
          id: string
          labor_cost: number | null
          location_id: string
          note: string | null
          organization_id: string
          source: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          worked_minutes: number | null
        }
        SetofOptions: {
          from: "*"
          to: "shifts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      close_day: {
        Args: { p_date: string; p_location_id: string }
        Returns: {
          actual_cash: number | null
          attention: Json
          business_date: string
          card_sales: number
          cash_difference: number | null
          cash_sales: number
          closed_at: string
          closed_by: string | null
          comparisons: Json
          created_at: string
          daily_report_id: string
          expected_cash: number | null
          goods_total: number
          id: string
          labor_employee_count: number
          labor_minutes: number
          labor_total: number
          location_id: string
          margin: number | null
          organization_id: string
          other_sales: number
          other_total: number
          profit: number
          total_expenses: number
          total_sales: number
          utilities_total: number
        }
        SetofOptions: {
          from: "*"
          to: "closeout_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_manual_shift: {
        Args: {
          p_break_minutes?: number
          p_clock_in: string
          p_clock_out: string
          p_employee_id: string
          p_location_id: string
          p_reason: string
        }
        Returns: {
          break_minutes: number
          business_date: string
          clock_in_at: string
          clock_out_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          hourly_rate_snapshot: number | null
          id: string
          labor_cost: number | null
          location_id: string
          note: string | null
          organization_id: string
          source: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          worked_minutes: number | null
        }
        SetofOptions: {
          from: "*"
          to: "shifts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_organization: {
        Args: {
          p_business_type?: string
          p_currency?: string
          p_name: string
          p_timezone?: string
        }
        Returns: string
      }
      edit_daily_report: {
        Args: { p_patch: Json; p_reason?: string; p_report_id: string }
        Returns: {
          actual_cash: number | null
          business_date: string
          card_sales: number | null
          cash_goods: number | null
          cash_sales: number | null
          check_goods: number | null
          close_count: number
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          expected_cash: number | null
          id: string
          location_id: string
          notes: string | null
          organization_id: string
          other_expenses: number | null
          other_sales: number | null
          reopened_at: string | null
          reopened_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
          utilities: number | null
        }
        SetofOptions: {
          from: "*"
          to: "daily_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      invitation_preview: {
        Args: { p_token: string }
        Returns: {
          email: string
          employee_name: string
          expires_at: string
          organization_name: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["invitation_status"]
        }[]
      }
      log_activity_public: {
        Args: {
          p_org: string
          p_loc: string | null
          p_action: string
          p_entity_type?: string | null
          p_entity_id?: string | null
          p_before?: Json | null
          p_after?: Json | null
          p_note?: string | null
        }
        Returns: string
      }
      employee_hours_summary: {
        Args: { p_org: string; p_from: string; p_to: string }
        Returns: {
          employee_id: string
          employee_name: string
          shifts: number
          minutes: number
          labor_cost: number
          flagged: number
        }[]
      }
      run_org_checks: {
        Args: { p_org: string }
        Returns: number
      }
      seed_demo_data: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      delete_demo_organization: {
        Args: { p_org: string }
        Returns: undefined
      }
      labor_detail: {
        Args: { p_date: string; p_loc: string }
        Returns: {
          clock_in_at: string
          clock_out_at: string
          employee_id: string
          employee_name: string
          hourly_rate: number
          labor_cost: number
          shift_id: string
          status: Database["public"]["Enums"]["shift_status"]
          verification_status: Database["public"]["Enums"]["verification_status"]
          worked_minutes: number
        }[]
      }
      materialize_recurring_expenses: {
        Args: { p_org: string; p_until?: string }
        Returns: number
      }
      my_location_ids: { Args: { p_org: string }; Returns: string[] }
      reopen_day: {
        Args: { p_reason: string; p_report_id: string }
        Returns: {
          actual_cash: number | null
          business_date: string
          card_sales: number | null
          cash_goods: number | null
          cash_sales: number | null
          check_goods: number | null
          close_count: number
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          expected_cash: number | null
          id: string
          location_id: string
          notes: string | null
          organization_id: string
          other_expenses: number | null
          other_sales: number | null
          reopened_at: string | null
          reopened_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
          utilities: number | null
        }
        SetofOptions: {
          from: "*"
          to: "daily_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_daily_report_draft: {
        Args: { p_date: string; p_location_id: string; p_patch: Json }
        Returns: {
          actual_cash: number | null
          business_date: string
          card_sales: number | null
          cash_goods: number | null
          cash_sales: number | null
          check_goods: number | null
          close_count: number
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          expected_cash: number | null
          id: string
          location_id: string
          notes: string | null
          organization_id: string
          other_expenses: number | null
          other_sales: number | null
          reopened_at: string | null
          reopened_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
          utilities: number | null
        }
        SetofOptions: {
          from: "*"
          to: "daily_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      store_status: {
        Args: { p_date: string; p_org: string }
        Returns: {
          closed_at: string
          closed_by_name: string
          closeout_id: string
          closeout_status: Database["public"]["Enums"]["report_status"]
          closing_checklist_status: Database["public"]["Enums"]["submission_status"]
          location_id: string
          opened_at: string
          opened_by_name: string
          opening_checklist_status: Database["public"]["Enums"]["submission_status"]
          working_count: number
        }[]
      }
    }
    Enums: {
      accounting_bucket: "goods" | "labor" | "utilities" | "other"
      checklist_kind: "opening" | "closing" | "custom"
      employment_status: "active" | "inactive" | "terminated"
      expense_status: "paid" | "expected"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      member_status: "active" | "invited" | "inactive"
      notification_kind:
        | "employee_clock_in"
        | "employee_clock_out"
        | "employee_late"
        | "store_not_opened"
        | "store_not_closed"
        | "missing_closeout"
        | "cash_shortage"
        | "large_expense"
        | "outside_radius"
        | "forgot_clock_out"
        | "invitation"
        | "general"
      org_role: "owner" | "manager" | "employee"
      payment_method:
        | "cash"
        | "credit_card"
        | "debit_card"
        | "check"
        | "ach"
        | "other"
      recurrence_frequency: "weekly" | "biweekly" | "monthly" | "yearly"
      report_status: "open" | "closed"
      shift_status: "active" | "completed" | "cancelled"
      submission_status: "in_progress" | "completed"
      verification_kind: "clock_in" | "clock_out"
      verification_status:
        | "verified"
        | "location_issue"
        | "missing_photo"
        | "needs_review"
        | "manager_adjusted"
        | "manual"
        | "unverified"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      accounting_bucket: ["goods", "labor", "utilities", "other"],
      checklist_kind: ["opening", "closing", "custom"],
      employment_status: ["active", "inactive", "terminated"],
      expense_status: ["paid", "expected"],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      member_status: ["active", "invited", "inactive"],
      notification_kind: [
        "employee_clock_in",
        "employee_clock_out",
        "employee_late",
        "store_not_opened",
        "store_not_closed",
        "missing_closeout",
        "cash_shortage",
        "large_expense",
        "outside_radius",
        "forgot_clock_out",
        "invitation",
        "general",
      ],
      org_role: ["owner", "manager", "employee"],
      payment_method: [
        "cash",
        "credit_card",
        "debit_card",
        "check",
        "ach",
        "other",
      ],
      recurrence_frequency: ["weekly", "biweekly", "monthly", "yearly"],
      report_status: ["open", "closed"],
      shift_status: ["active", "completed", "cancelled"],
      submission_status: ["in_progress", "completed"],
      verification_kind: ["clock_in", "clock_out"],
      verification_status: [
        "verified",
        "location_issue",
        "missing_photo",
        "needs_review",
        "manager_adjusted",
        "manual",
        "unverified",
      ],
    },
  },
} as const
