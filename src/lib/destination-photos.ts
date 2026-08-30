/**
 * Locally hosted destination photography.
 *
 * Every image was produced for this project and shows the landmark of its own
 * city, so a card can never display a photo of a different place. Cities with
 * more than one airport (Rio: GIG/SDU, São Paulo: GRU/CGH, Campinas hub: VCP)
 * intentionally share the city image.
 */
import BOG from "@/assets/destinos/BOG.jpg";
import BPS from "@/assets/destinos/BPS.jpg";
import BSB from "@/assets/destinos/BSB.jpg";
import CDG from "@/assets/destinos/CDG.jpg";
import CNF from "@/assets/destinos/CNF.jpg";
import CUN from "@/assets/destinos/CUN.jpg";
import CWB from "@/assets/destinos/CWB.jpg";
import DXB from "@/assets/destinos/DXB.jpg";
import EZE from "@/assets/destinos/EZE.jpg";
import FCO from "@/assets/destinos/FCO.jpg";
import FLN from "@/assets/destinos/FLN.jpg";
import FOR from "@/assets/destinos/FOR.jpg";
import GIG from "@/assets/destinos/GIG.jpg";
import GRU from "@/assets/destinos/GRU.jpg";
import IGU from "@/assets/destinos/IGU.jpg";
import JFK from "@/assets/destinos/JFK.jpg";
import JPA from "@/assets/destinos/JPA.jpg";
import LAX from "@/assets/destinos/LAX.jpg";
import LHR from "@/assets/destinos/LHR.jpg";
import LIM from "@/assets/destinos/LIM.jpg";
import LIS from "@/assets/destinos/LIS.jpg";
import MAD from "@/assets/destinos/MAD.jpg";
import MAO from "@/assets/destinos/MAO.jpg";
import MCO from "@/assets/destinos/MCO.jpg";
import MCZ from "@/assets/destinos/MCZ.jpg";
import MEX from "@/assets/destinos/MEX.jpg";
import MIA from "@/assets/destinos/MIA.jpg";
import MVD from "@/assets/destinos/MVD.jpg";
import NAT from "@/assets/destinos/NAT.jpg";
import POA from "@/assets/destinos/POA.jpg";
import REC from "@/assets/destinos/REC.jpg";
import SCL from "@/assets/destinos/SCL.jpg";
import SSA from "@/assets/destinos/SSA.jpg";
import VIX from "@/assets/destinos/VIX.jpg";

export const DESTINATION_PHOTOS: Record<string, string> = {
  BOG,
  BPS,
  BSB,
  CDG,
  CNF,
  CUN,
  CWB,
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
  IGU,
  JFK,
  JPA,
  LAX,
  LHR,
  LIM,
  LIS,
  MAD,
  MAO,
  MCO,
  MCZ,
  MEX,
  MIA,
  MVD,
  NAT,
  POA,
  REC,
  SCL,
  SSA,
  VIX,
};

/** Neutral image for codes that are not in the catalog. */
export const FALLBACK_DESTINATION_PHOTO = GRU;
