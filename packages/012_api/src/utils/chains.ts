export const CHAINS = {
	ethereum: {
		id: 1,
		name: 'Ethereum',
	},
	arbitrum: {
		id: 42161,
		name: 'Arbitrum One',
	},
	base: {
		id: 8453,
		name: 'Base',
	},
	bnb: {
		id: 56,
		name: 'BNB Chain',
	},
	optimism: {
		id: 10,
		name: 'Optimism',
	},
	polygon: {
		id: 137,
		name: 'Polygon',
	},
	avalanche: {
		id: 43114,
		name: 'Avalanche',
	},
	gnosis: {
		id: 100,
		name: 'Gnosis',
	},
	fantom: {
		id: 250,
		name: 'Fantom',
	},
	zksync: {
		id: 324,
		name: 'zkSync Era',
	},
};

export const getChainById = (id: number | string) => {
	return Object.values(CHAINS).find((chain) => chain.id == id)!;
};
