"use client";
import { Button } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { preMemo } from "@/Lib/preMemo";

export default function Taskseed() {
  return (
    <div>
      <Button
        variant="contained"
        size="large"
        onClick={async () => {
          const data = await preMemo.get();
          console.log(data);
        }}
      >
        taskseed作成
      </Button>
      <Card variant="outlined">
        <CardContent>card</CardContent>
      </Card>
      <FormControlLabel required control={<Checkbox />} label="Required" />
    </div>
  );
}
