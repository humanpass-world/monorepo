fetch(
  `https://developer.worldcoin.org/api/v2/minikit/transaction/debug?app_id=${process.env.VITE_WORLDCOIN_APP_ID}`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.WLD_DEV_PORTAL_API_KEY}`,
    },
  },
)
  .then((res) => res.json())
  .then((data) => {
    const transaction = data.transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .at(0);

    console.log(transaction);
  });
