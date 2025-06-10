import { Ticket } from "@/types/Store";
import { Button, Card, CardActions, CardContent, Grid, Typography } from "@mui/material";

interface TicketCardListProps {
    tickets: Ticket[];
    onSelect: (ticket: Ticket) => void;
}

/**
 * TicketCardList コンポーネント。
 *
 * - 店内の食券を一覧表示するコンポーネント。
 * - foodCourtPage から使用する。
 * - foodCourtPage から選択された店舗の情報を props として受け取り、各店舗の食券を表示。
 * - 選択された店舗の情報を props として受け取り、各店舗の食券を表示。
 * -  foodCourtPage から受け取った onSelect という関数を使用して、選択された店舗の情報を foodCourtPage に返す。
 */
export function TicketCardList({ tickets, onSelect }: TicketCardListProps) {
    return (
        <Grid container spacing={2} justifyContent="center">
            {tickets.map((ticket) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={ticket.id}>
                    <Card
                        sx={{
                            width: 200,
                            height: 120,
                            display: "flex",
                            flexDirection: "column",
                            mx: "auto",
                            backgroundColor: "#fffacd"
                        }}
                    >
                        <CardContent sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography variant="body2" align="center">
                                {ticket.menu_name}
                            </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: "center", pb: 4 }}>
                            <Button variant="contained" onClick={() => onSelect(ticket)}>
                                ¥{ticket.price}
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            ))}
        </Grid>
    )
}