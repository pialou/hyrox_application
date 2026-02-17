import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Workouts } from "@/pages/Workouts";
import { Coach } from "@/pages/Coach";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/coach" element={<Coach />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
