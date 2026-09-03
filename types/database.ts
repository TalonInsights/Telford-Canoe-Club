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
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
        }
        Relationships: []
      }
      club_settings: {
        Row: {
          bank_payment_note: string
          created_at: string
          id: boolean
          membership_year_label: string
          payment_provider: string
          price_adult_pence: number
          price_family_pence: number
          price_junior_pence: number
          show_unconfirmed: boolean
          site_status: string
          site_status_note: string | null
          updated_at: string | null
        }
        Insert: {
          bank_payment_note?: string
          created_at?: string
          id?: boolean
          membership_year_label?: string
          payment_provider?: string
          price_adult_pence?: number
          price_family_pence?: number
          price_junior_pence?: number
          show_unconfirmed?: boolean
          site_status?: string
          site_status_note?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_payment_note?: string
          created_at?: string
          id?: boolean
          membership_year_label?: string
          payment_provider?: string
          price_adult_pence?: number
          price_family_pence?: number
          price_junior_pence?: number
          show_unconfirmed?: boolean
          site_status?: string
          site_status_note?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      committee_roles: {
        Row: {
          contact_email: string | null
          created_at: string
          description: string | null
          holder_display_name: string | null
          holder_user_id: string | null
          id: string
          is_vacant: boolean | null
          role_title: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          holder_display_name?: string | null
          holder_user_id?: string | null
          id?: string
          is_vacant?: boolean | null
          role_title: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          holder_display_name?: string | null
          holder_user_id?: string | null
          id?: string
          is_vacant?: boolean | null
          role_title?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_roles_holder_user_id_fkey"
            columns: ["holder_user_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "committee_roles_holder_user_id_fkey"
            columns: ["holder_user_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "committee_roles_holder_user_id_fkey"
            columns: ["holder_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          effective_from: string | null
          file_name: string
          id: string
          mime_type: string
          review_due: string | null
          size_bytes: number
          sort_order: number
          storage_path: string
          superseded_by: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
          version_label: string | null
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          category?: string
          created_at?: string
          effective_from?: string | null
          file_name: string
          id?: string
          mime_type: string
          review_due?: string | null
          size_bytes: number
          sort_order?: number
          storage_path: string
          superseded_by?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
          version_label?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          category?: string
          created_at?: string
          effective_from?: string | null
          file_name?: string
          id?: string
          mime_type?: string
          review_due?: string | null
          size_bytes?: number
          sort_order?: number
          storage_path?: string
          superseded_by?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version_label?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body: Json | null
          created_at: string
          id: string
          preheader: string | null
          recipient_count: number | null
          resend_batch_ids: string[] | null
          scheduled_for: string | null
          segment_id: string | null
          segment_snapshot: Json | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          subject: string
          updated_at: string | null
        }
        Insert: {
          body?: Json | null
          created_at?: string
          id?: string
          preheader?: string | null
          recipient_count?: number | null
          resend_batch_ids?: string[] | null
          scheduled_for?: string | null
          segment_id?: string | null
          segment_snapshot?: Json | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject: string
          updated_at?: string | null
        }
        Update: {
          body?: Json | null
          created_at?: string
          id?: string
          preheader?: string | null
          recipient_count?: number | null
          resend_batch_ids?: string[] | null
          scheduled_for?: string | null
          segment_id?: string | null
          segment_snapshot?: Json | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_campaigns_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_campaigns_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_recipients: {
        Row: {
          campaign_id: string
          created_at: string
          email: string
          error: string | null
          id: string
          resend_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          email: string
          error?: string | null
          id?: string
          resend_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          resend_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "email_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_bookings: {
        Row: {
          booked_at: string
          cancelled_at: string | null
          checked_in_at: string | null
          created_at: string
          event_id: string
          guests: number
          id: string
          note: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booked_at?: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          guests?: number
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booked_at?: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          guests?: number
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "event_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "event_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_media: {
        Row: {
          caption: string | null
          created_at: string
          embed_url: string | null
          event_id: string
          id: string
          kind: string
          sort_order: number
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          embed_url?: string | null
          event_id: string
          id?: string
          kind: string
          sort_order?: number
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          embed_url?: string | null
          event_id?: string
          id?: string
          kind?: string
          sort_order?: number
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "event_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "event_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          allow_waitlist: boolean
          body: Json | null
          booking_closes_at: string | null
          booking_enabled: boolean
          booking_opens_at: string | null
          capacity: number | null
          category: string
          cost_note: string | null
          cost_pence: number
          cover_image_path: string | null
          created_at: string
          ends_at: string | null
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          members_only_booking: boolean
          organiser_user_id: string | null
          recurrence_rule: string | null
          slug: string
          starts_at: string
          status: string
          summary: string | null
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility"]
          water_level_dependent: boolean
        }
        Insert: {
          all_day?: boolean
          allow_waitlist?: boolean
          body?: Json | null
          booking_closes_at?: string | null
          booking_enabled?: boolean
          booking_opens_at?: string | null
          capacity?: number | null
          category?: string
          cost_note?: string | null
          cost_pence?: number
          cover_image_path?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          members_only_booking?: boolean
          organiser_user_id?: string | null
          recurrence_rule?: string | null
          slug: string
          starts_at: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
          water_level_dependent?: boolean
        }
        Update: {
          all_day?: boolean
          allow_waitlist?: boolean
          body?: Json | null
          booking_closes_at?: string | null
          booking_enabled?: boolean
          booking_opens_at?: string | null
          capacity?: number | null
          category?: string
          cost_note?: string | null
          cost_pence?: number
          cover_image_path?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          members_only_booking?: boolean
          organiser_user_id?: string | null
          recurrence_rule?: string | null
          slug?: string
          starts_at?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
          water_level_dependent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "events_organiser_user_id_fkey"
            columns: ["organiser_user_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "events_organiser_user_id_fkey"
            columns: ["organiser_user_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "events_organiser_user_id_fkey"
            columns: ["organiser_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          imported_count: number
          log: Json | null
          row_count: number
          run_by: string | null
          skipped_count: number
          source: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          imported_count?: number
          log?: Json | null
          row_count?: number
          run_by?: string | null
          skipped_count?: number
          source: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          imported_count?: number
          log?: Json | null
          row_count?: number
          run_by?: string | null
          skipped_count?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_run_by_fkey"
            columns: ["run_by"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "import_batches_run_by_fkey"
            columns: ["run_by"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "import_batches_run_by_fkey"
            columns: ["run_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      membership_members: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_junior: boolean
          membership_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_junior?: boolean
          membership_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_junior?: boolean
          membership_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_members_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "membership_members_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "membership_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "membership_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      membership_periods: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_current: boolean
          label: string
          starts_on: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_current?: boolean
          label: string
          starts_on: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_current?: boolean
          label?: string
          starts_on?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          amount_pence: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          paypal_capture_id: string | null
          paypal_order_id: string | null
          period_id: string
          primary_user_id: string
          recorded_by: string | null
          source: Database["public"]["Enums"]["payment_source"]
          status: Database["public"]["Enums"]["membership_status"]
          tier: Database["public"]["Enums"]["membership_tier"]
          updated_at: string | null
        }
        Insert: {
          amount_pence: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          paypal_capture_id?: string | null
          paypal_order_id?: string | null
          period_id: string
          primary_user_id: string
          recorded_by?: string | null
          source: Database["public"]["Enums"]["payment_source"]
          status?: Database["public"]["Enums"]["membership_status"]
          tier: Database["public"]["Enums"]["membership_tier"]
          updated_at?: string | null
        }
        Update: {
          amount_pence?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          paypal_capture_id?: string | null
          paypal_order_id?: string | null
          period_id?: string
          primary_user_id?: string
          recorded_by?: string | null
          source?: Database["public"]["Enums"]["payment_source"]
          status?: Database["public"]["Enums"]["membership_status"]
          tier?: Database["public"]["Enums"]["membership_tier"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "memberships_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "membership_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_primary_user_id_fkey"
            columns: ["primary_user_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "memberships_primary_user_id_fkey"
            columns: ["primary_user_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "memberships_primary_user_id_fkey"
            columns: ["primary_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "memberships_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "memberships_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "memberships_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notices: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          pinned: boolean
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          pinned?: boolean
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pages: {
        Row: {
          author_user_id: string | null
          body: Json | null
          created_at: string
          excerpt: string | null
          hero_image_path: string | null
          id: string
          nav_order: number
          nav_parent: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          show_in_nav: boolean
          slug: string
          status: string
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          author_user_id?: string | null
          body?: Json | null
          created_at?: string
          excerpt?: string | null
          hero_image_path?: string | null
          id?: string
          nav_order?: number
          nav_parent?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_in_nav?: boolean
          slug: string
          status?: string
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          author_user_id?: string | null
          body?: Json | null
          created_at?: string
          excerpt?: string | null
          hero_image_path?: string | null
          id?: string
          nav_order?: number
          nav_parent?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_in_nav?: boolean
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "pages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          author_user_id: string | null
          body: Json | null
          category: string | null
          cover_image_path: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          author_user_id?: string | null
          body?: Json | null
          category?: string | null
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          author_user_id?: string | null
          body?: Json | null
          category?: string | null
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_path: string | null
          bc_membership_number: string | null
          created_at: string
          date_of_birth: string | null
          deactivated_at: string | null
          email: string
          email_opt_in: boolean
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          guardian_name: string | null
          guardian_phone: string | null
          last_name: string
          legacy_arm_user_id: number | null
          medical_notes: string | null
          notes_internal: string | null
          phone: string | null
          postcode: string | null
          role: Database["public"]["Enums"]["app_role"]
          town: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_path?: string | null
          bc_membership_number?: string | null
          created_at?: string
          date_of_birth?: string | null
          deactivated_at?: string | null
          email: string
          email_opt_in?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          last_name?: string
          legacy_arm_user_id?: number | null
          medical_notes?: string | null
          notes_internal?: string | null
          phone?: string | null
          postcode?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          town?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_path?: string | null
          bc_membership_number?: string | null
          created_at?: string
          date_of_birth?: string | null
          deactivated_at?: string | null
          email?: string
          email_opt_in?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          last_name?: string
          legacy_arm_user_id?: number | null
          medical_notes?: string | null
          notes_internal?: string | null
          phone?: string | null
          postcode?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          town?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      segments: {
        Row: {
          created_at: string
          created_by: string | null
          definition: Json
          id: string
          is_system: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          definition: Json
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          definition?: Json
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "segments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "current_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "segments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "membership_history"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "segments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      current_members: {
        Row: {
          email: string | null
          first_name: string | null
          is_junior: boolean | null
          last_name: string | null
          membership_id: string | null
          paid_at: string | null
          period: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          source: Database["public"]["Enums"]["payment_source"] | null
          status: Database["public"]["Enums"]["membership_status"] | null
          tier: Database["public"]["Enums"]["membership_tier"] | null
          user_id: string | null
        }
        Relationships: []
      }
      membership_history: {
        Row: {
          email: string | null
          first_name: string | null
          is_junior: boolean | null
          last_name: string | null
          paid_at: string | null
          period: string | null
          period_id: string | null
          source: Database["public"]["Enums"]["payment_source"] | null
          status: string | null
          tier: Database["public"]["Enums"]["membership_tier"] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      abandon_online_payment: {
        Args: { p_order_ref: string }
        Returns: undefined
      }
      admin_create_membership: {
        Args: {
          p_activate?: boolean
          p_amount_pence?: number
          p_family_names?: string[]
          p_note?: string
          p_period_id: string
          p_source: Database["public"]["Enums"]["payment_source"]
          p_tier: Database["public"]["Enums"]["membership_tier"]
          p_user_id: string
        }
        Returns: string
      }
      admin_extend_membership: {
        Args: { p_membership_id: string; p_note?: string }
        Returns: string
      }
      audit: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_entity: string
          p_entity_id?: string
          p_ip?: string
        }
        Returns: undefined
      }
      begin_online_payment: {
        Args: { p_membership_id: string; p_order_ref: string }
        Returns: undefined
      }
      complete_online_payment: {
        Args: { p_capture_ref: string; p_order_ref: string }
        Returns: string
      }
      has_role: {
        Args: { min: Database["public"]["Enums"]["app_role"]; uid: string }
        Returns: boolean
      }
      is_current_member: { Args: { uid: string }; Returns: boolean }
      is_junior: { Args: { dob: string }; Returns: boolean }
      is_membership_payer: {
        Args: { mid: string; uid: string }
        Returns: boolean
      }
      membership_covers: {
        Args: { mid: string; uid: string }
        Returns: boolean
      }
      request_membership: {
        Args: {
          p_family_names?: string[]
          p_period_id?: string
          p_tier: Database["public"]["Enums"]["membership_tier"]
        }
        Returns: string
      }
      run_expiry_sweep: { Args: never; Returns: Json }
      set_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "registered" | "member" | "committee" | "admin"
      booking_status:
        | "booked"
        | "waitlist"
        | "cancelled"
        | "attended"
        | "no_show"
      campaign_status: "draft" | "sending" | "sent" | "failed"
      membership_status:
        | "pending"
        | "active"
        | "expired"
        | "cancelled"
        | "refunded"
      membership_tier: "adult" | "junior" | "family"
      payment_source:
        | "paypal"
        | "manual_bank"
        | "manual_cash"
        | "imported"
        | "complimentary"
      visibility: "public" | "members" | "committee"
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
      app_role: ["registered", "member", "committee", "admin"],
      booking_status: [
        "booked",
        "waitlist",
        "cancelled",
        "attended",
        "no_show",
      ],
      campaign_status: ["draft", "sending", "sent", "failed"],
      membership_status: [
        "pending",
        "active",
        "expired",
        "cancelled",
        "refunded",
      ],
      membership_tier: ["adult", "junior", "family"],
      payment_source: [
        "paypal",
        "manual_bank",
        "manual_cash",
        "imported",
        "complimentary",
      ],
      visibility: ["public", "members", "committee"],
    },
  },
} as const
