import { Brand, Social, Nav, Agreement } from "@/types/blocks/base";

export interface Footer {
  disabled?: boolean;
  name?: string;
  brand?: Brand;
  nav?: Nav;
  copyright?: string;
  social?: Social;
  agreement?: Agreement;
  show_sign?: boolean;
  show_subscribe?: boolean;
  subscribe?: {
    title?: string;
    description?: string;
  };
}
