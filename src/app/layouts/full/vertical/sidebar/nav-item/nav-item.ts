export interface NavItem {
    displayName?: string;
    disabled?: boolean;
    external?: boolean;
    twoLines?: boolean;
    divider?: boolean;
    chip?: boolean;
    iconName?: string;
    navCap?: string;
    chipContent?: string;
    chipClass?: string;
    subtext?: string;
    route?: string;
    children?: NavItem[];
    ddType?: string;
    id?: number;
    subItemIcon?: boolean;
    permission?: string;
    /** Basta con uno. Es para los rótulos de sección: sin esto un cliente veía "Administración" flotando encima de nada. */
    permissionsAny?: string[];
  }
  