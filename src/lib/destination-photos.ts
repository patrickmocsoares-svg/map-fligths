/**
 * Locally hosted destination photography.
 *
 * Every image was produced for this project and shows the landmark of its own
 * city, so a card can never display a photo of a different place. Cities with
 * more than one airport (Rio: GIG/SDU, São Paulo: GRU/CGH, Campinas hub: VCP)
 * intentionally share the city image.
 */
import BOG from "@/assets/destinos/BOG.jpg";
import BSB from "@/assets/destinos/BSB.jpg";
import CDG from "@/assets/destinos/CDG.jpg";
import CNF from "@/assets/destinos/CNF.jpg";
import DXB from "@/assets/destinos/DXB.jpg";
import EZE from "@/assets/destinos/EZE.jpg";
import FCO from "@/assets/destinos/FCO.jpg";
import FLN from "@/assets/destinos/FLN.jpg";
import FOR from "@/assets/destinos/FOR.jpg";
import GIG from "@/assets/destinos/GIG.jpg";
import GRU from "@/assets/destinos/GRU.jpg";
import JFK from "@/assets/destinos/JFK.jpg";
import LAX from "@/assets/destinos/LAX.jpg";
import LHR from "@/assets/destinos/LHR.jpg";
import LIS from "@/assets/destinos/LIS.jpg";
import MAD from "@/assets/destinos/MAD.jpg";
import MAO from "@/assets/destinos/MAO.jpg";
import MEX from "@/assets/destinos/MEX.jpg";
import MIA from "@/assets/destinos/MIA.jpg";
import POA from "@/assets/destinos/POA.jpg";
import REC from "@/assets/destinos/REC.jpg";
import SCL from "@/assets/destinos/SCL.jpg";
import SSA from "@/assets/destinos/SSA.jpg";

export const DESTINATION_PHOTOS: Record<string, string> = {
  BOG,
  BSB,
  CDG,
  CNF,
  DXB,
  EZE,
  FCO,
  FLN,
  FOR,
  GIG,
  SDU: GIG,
  GRU,
  CGH: GRU,
  VCP: GRU,
  JFK,
  LAX,
  LHR,
  LIS,
  MAD,
  MAO,
  MEX,
  MIA,
  POA,
  REC,
  SCL,
  SSA,
};

/** Neutral image for codes that are not in the catalog. */
export const FALLBACK_DESTINATION_PHOTO = GRU;
