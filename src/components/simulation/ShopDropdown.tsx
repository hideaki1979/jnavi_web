import { SimulationSelectStoresData } from "@/types/Store";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";

interface ShopDropdownProps {
    stores: SimulationSelectStoresData[]
    selectedStore: string;
    onChange: (event: SelectChangeEvent<string>) => void;
}

export function ShopDropDown({ stores, selectedStore, onChange }: ShopDropdownProps) {
    return (
        <FormControl fullWidth margin="normal">
            <InputLabel>店舗を選択してください</InputLabel>
            <Select
                labelId="shop-select-label"
                value={selectedStore}
                label="店舗を選択してください"
                onChange={onChange}
                sx={{
                    backgroundColor: "#fffacd",
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#e0e0e0",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#bdbdbd",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#1976d2",
                    }
                }}
            >
                {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                        {store.branch_name ? `${store.store_name} ${store.branch_name}` : store.store_name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}