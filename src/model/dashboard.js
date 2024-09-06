// Function to process expense details and return category-wise data
function getCategoryWiseData(expenseDetails) {
  const categoryData = {};

  // Process each expense and accumulate data by category
  expenseDetails.forEach((expense) => {
    const category = expense.category;
    const amount = expense.amount;

    if (categoryData[category]) {
      categoryData[category] += amount;
    } else {
      categoryData[category] = amount;
    }
  });

  // Convert data to an array for Chart.js
  const categories = Object.keys(categoryData);
  const totalExpenses = Object.values(categoryData);

  return { categories, totalExpenses };
}
function getName() {
  return "Himanshu";
}
module.exports = getName;
module.exports = getCategoryWiseData;
