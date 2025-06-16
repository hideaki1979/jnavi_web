import { useDebounce } from "@/hooks/useDebounce";
import { SimulationSelectStoresData } from "@/types/Store";
import { Autocomplete, TextField } from "@mui/material";
import { useMemo, useState } from "react";

interface ShopAutocompleteProps {
    stores: SimulationSelectStoresData[]
    selectedStore: SimulationSelectStoresData | null;
    onChange: (store: SimulationSelectStoresData | null) => void;
}

/**
 * シミュレーション画面の店舗選択用のAutoCompleteコンポーネント
 * テキスト入力による検索機能とデバウンス機能を提供
 *
 * @param {SimulationSelectStoresData[]} stores 店舗情報の配列
 * @param {SimulationSelectStoresData | null} selectedStore 選択中の店舗オブジェクト
 * @param {(store: SimulationSelectStoresData | null) => void} onChange 選択された店舗オブジェクトを保持するstateを更新するためのコールバック
 * @returns AutoCompleteコンポーネント
 */
export function ShopAutocomplete({ stores, selectedStore, onChange }: ShopAutocompleteProps) {
    const [inputValue, setInputValue] = useState('')
    const debouncedInputValue: string = useDebounce(inputValue, 300)

    // デバウンスされた入力値に基づいてフィルタリング
    const filteredStores = useMemo(() => {
        if (!debouncedInputValue) {
            return stores
        }

        return stores.filter((store) => {
            const searchText = debouncedInputValue.toLowerCase()
            const storeName = store.store_name.toLowerCase()
            const branchName = store.branch_name?.toLowerCase()
            const fullName = `${storeName} ${branchName}`.trim()

            return fullName.includes(searchText)
        })
    }, [stores, debouncedInputValue])

    return (
        <Autocomplete
            options={filteredStores}
            value={selectedStore}
            onChange={(_, newValue) => onChange(newValue)}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
            getOptionLabel={(option) =>
                option.branch_name
                    ? `${option.store_name} ${option.branch_name}`
                    : option.store_name
            }
            isOptionEqualToValue={(option, value) =>
                option.id === value.id
            }
            noOptionsText='該当する店舗が見つかりません'
            renderInput={(params) => (
                <TextField
                    {...params}
                    label='店舗を選択してください'
                    placeholder="店舗名を入力してください"
                    fullWidth
                    margin="normal"
                    sx={{
                        backgroundColor: "#fffacd",
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                                borderColor: "#e0e0e0",
                            },
                            "&:hover fieldset": {
                                borderColor: "#bdbdbd",
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: "#1976d2",
                            }
                        }
                    }}
                />
            )}
            sx={{
                "& .MuiAutocomplete-paper": {
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }
            }}
        />
    )
}