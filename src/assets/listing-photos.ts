const commonsThumb = (path: string, file: string) =>
	`https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/960px-${file}`;

export const listingPhotos = {
	stratocaster: commonsThumb(
		"7/7a",
		"Fender_American_Stratocaster_%282008-11-02_16.03.09_by_irish10567%29.jpg",
	),
	lesPaul: commonsThumb("1/1c", "Full_front_R9_Les_Paul.jpg"),
	telecaster: commonsThumb(
		"7/73",
		"Fender_Custom_Shop_Telecaster_--_2024_--_0051-85.jpg",
	),
	ibanezRg: commonsThumb(
		"e/ed",
		"Ibanez_RG350EXZ_BK_Electric_Guitar_c.a._2011.jpg",
	),
	martinD28: commonsThumb("c/ce", "Martin_D-28.jpg"),
	taylorAcoustic: commonsThumb(
		"f/f4",
		"TGFT01_Play_away_-_Taylor_Guitar_Factory.jpg",
	),
	yamahaClassical: commonsThumb(
		"e/e0",
		"Yamaha_C-40_soundhole_%26_label_-_Land_Locked_Blues._%282009-03-15_00.28.33_by_mt_23%29.jpg",
	),
	nordStage: commonsThumb("d/d4", "Nord_Stage_88_lowres.jpg"),
	prophetSynth: commonsThumb("8/80", "Prophet_%2708_%28rear_center%29.jpg"),
	korgMinilogue: commonsThumb("a/a5", "Korg_Minilogue.jpg"),
	bossDs1: commonsThumb("0/0f", "Boss-DS-1.jpg"),
	tubeScreamer: commonsThumb("5/5c", "Ibanez_ts9_tube_screamer.jpg"),
	bigMuff:
		"https://upload.wikimedia.org/wikipedia/commons/c/ca/Big_Muff_Pi_008.jpg",
	shureSm58:
		"https://upload.wikimedia.org/wikipedia/commons/7/7d/Micro_Shure_SM58.jpg",
} as const;
