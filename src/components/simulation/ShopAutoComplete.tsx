import { useDebounce } from "@/hooks/useDebounce";
import { SimulationSelectStoresData } from "@/types/Store";
import { Autocomplete, TextField, useTheme } from "@mui/material";
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
    const theme = useTheme()

    // デバウンスされた入力値に基づいてフィルタリング
    const filteredStores = useMemo(() => {
        if (!debouncedInputValue) {
            return stores
        }

        return stores.filter((store) => {
            const searchText = debouncedInputValue.toLowerCase()
            const storeName = store.store_name.toLowerCase()
            const branchName = store.branch_name?.toLowerCase()
            const fullName = branchName ? `${storeName} ${branchName}` : storeName

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
                    size="small"
                    sx={{
                        backgroundColor: theme.palette.background.paper,
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                                borderColor: theme.palette.divider
                            },
                            "&:hover fieldset": {
                                borderColor: theme.palette.primary.main
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: theme.palette.primary.main
                            }
                        },
                        "& .MuiInputBase-input": {
                            color: theme.palette.text.primary,
                        },
                        "& .MuiInputLabel-root": {
                            color: theme.palette.text.secondary,
                            "&.Mui-focused": {
                                color: theme.palette.primary.main,
                            }
                        }
                    }}
                />
            )}
            sx={{
                "& .MuiAutocomplete-paper": {
                    boxShadow: theme.shadows[8],
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius * 2,
                },
                "& .MuiAutocomplete-option": {
                    "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                    },
                    "&.Mui-focused": {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                    }
                }
            }}
        />
    )
}