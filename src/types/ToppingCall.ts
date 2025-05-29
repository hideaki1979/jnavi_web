/**
 * トッピング情報の型定義
 */
export interface ToppingData {
    id: number;
    topping_category: number;
    topping_name: string;
}

/**
 * コールオプション情報の型定義
 */
export interface CallOptionData {
    id: number;
    call_category: number;
    call_option_name: string;
}

/**
 * トッピング＋コールオプション情報の型定義
 */
export interface ResultToppingCall {
    topping: ToppingData;
    call_options: CallOptionData[];
}

/**
 * トッピング＋コールオプション取得APIのレスポンス型定義
 */
export interface ResultToppingCallApiRes {
    data: ResultToppingCall[];
    status: string;
    message: string;
}

// トッピング・コールID（店舗登録・更新・詳細画面用）
export interface FormattedToppingOptionIds {
    [topping_id: number]: number[];
}

// トッピング・コール名称（店舗詳細画面用）
export interface FormattedToppingOptionNames {
    [topping_name: string]: string[];
}

/**
 * トッピングコール情報の基底型型定義
 */
export interface BaseToppingCall {
    id?: number | string;
    topping_id: number | string;
    call_option_id: number | string;
    call_timing: "pre_call" | "post_call";
    noodle_type_id: number | string;
}

export interface SimulationToppingOption {
    toppingId: string | number;
    toppingName: string;
    options: {
        optionId: string | number;
        optionName: string;
        storeToppingCallId?: string | number;
    }[]
}
