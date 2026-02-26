package com.cafe.erp.menu.application.service;

import com.cafe.erp.menu.application.command.*;
import com.cafe.erp.menu.domain.model.*;
import com.cafe.erp.menu.infrastructure.persistence.*;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

@Service @RequiredArgsConstructor
public class MenuService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final RecipeRepository recipeRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    public List<Category> getActiveCategories() {
        return categoryRepository.findByActiveAndDeletedFalseOrderByDisplayOrder(true);
    }
    public List<Product> getProductsByCategory(UUID categoryId) {
        return productRepository.findByCategoryIdAndActiveAndDeletedFalseOrderByDisplayOrder(categoryId, true);
    }
    public List<Product> getMatchModeProducts() {
        return productRepository.findByAvailableInMatchModeAndActiveAndDeletedFalse(true, true);
    }
    @Transactional
    public Product createProduct(CreateProductRequest req) {
        Product product = Product.builder()
                .sku(req.getSku()).name(req.getName()).sellingPrice(req.getSellingPrice())
                .categoryId(req.getCategoryId()).imageUrl(req.getImageUrl())
                .availableInMatchMode(req.isAvailableInMatchMode())
                .displayOrder(req.getDisplayOrder()).build();
        return productRepository.save(product);
    }
    @Transactional
    public Product updatePrice(UUID productId, UpdatePriceRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> BusinessException.notFound("Product"));
        PriceHistory history = PriceHistory.builder()
                .productId(productId).oldPrice(product.getSellingPrice()).newPrice(req.getNewPrice())
                .changedBy(SecurityUtils.currentUsername())
                .reason(req.getReason()).build();
        priceHistoryRepository.save(history);
        product.setSellingPrice(req.getNewPrice());
        return productRepository.save(product);
    }
    @Transactional
    public void toggleProduct(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> BusinessException.notFound("Product"));
        product.setActive(!product.isActive());
        productRepository.save(product);
    }
}
